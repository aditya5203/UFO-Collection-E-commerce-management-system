import mongoose from "mongoose";
import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";
import { Address } from "../../../models/Address.model";
import discountService from "../../discounts/services/discount.service";
import { maybeSendInvoiceForOrder } from "../../../services/invoiceWorkflow.service";
import { notificationService } from "../../notifications/services/notification.service";

type ListInput = {
  search?: string;
  customerId?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

type UpdateInput = {
  paymentStatus?: string;
  orderStatus?: string;
  deliveryAssignment?: {
    deliveryManId?: string;
    note?: string;
    status?:
      | "Assigned"
      | "Picked Up"
      | "Out for Delivery"
      | "Delivered"
      | "Failed Delivery"
      | "Returned";
  };
};

type CreateOrderBody = {
  paymentMethod: "COD" | "Khalti" | "eSewa" | "Fonepay";
  paymentRef?: string;
  shippingPaisa?: number;
  couponCode?: string;
  items: Array<{
    productId: string;
    size?: string;
    color?: string;
    colorLabel?: string;
    qty: number;
  }>;
  addressId?: string;
  address?: {
    label?: "Home" | "Work" | "Other";
    fullName: string;
    phone: string;
    city: string;
    area: string;
    street: string;
    lat?: number;
    lng?: number;
  };
};

function safeRegex(input: string) {
  return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function normalizeNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

async function generateUniqueOrderCode() {
  for (let i = 0; i < 10; i++) {
    const code = `#${Math.floor(100000 + Math.random() * 900000)}`;
    const exists = await Order.findOne({ orderCode: code }).lean();
    if (!exists) return code;
  }
  return `#${Date.now().toString().slice(-6)}`;
}

function computeEstimatedDeliveryRange() {
  const today = new Date();

  const from = new Date(today);
  from.setDate(today.getDate() + 3);

  const to = new Date(today);
  to.setDate(today.getDate() + 4);

  const sameMonth =
    from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();

  if (sameMonth) {
    const month = from.toLocaleDateString("en-US", { month: "long" });
    return `${month} ${from.getDate()}–${to.getDate()}, ${to.getFullYear()}`;
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return `${fmt(from)} – ${fmt(to)}`;
}

function orderDetailsLink(orderCode: string) {
  const clean = String(orderCode || "").replace(/^#/, "").trim();
  return clean ? `/customerorderdetails/${clean}` : "/profile/orders";
}

function buildShippingAddressText(address: any) {
  if (!address) return "";

  return [
    (
      address.fullName ||
      `${address.firstName || ""} ${address.lastName || ""}`.trim()
    ).trim(),
    address.phone || "",
    `${address.cityOrMunicipality || ""}${
      address.district ? ", " + address.district : ""
    }`,
    `${address.addressLine || ""}${address.street ? ", " + address.street : ""}`,
    `${address.provinceId || ""}${address.postalCode ? " " + address.postalCode : ""}`,
    address.country || "Nepal",
  ]
    .filter(Boolean)
    .join("\n");
}

function deliveryOrderLink(orderId: string) {
  return `/delivery/orders/${orderId}`;
}

export const orderService = {
  async createOrder(userId: string, body: CreateOrderBody) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");
    if (!body?.items?.length) throw new Error("Cart is empty");
    if (!body.paymentMethod) throw new Error("paymentMethod is required");

    if (body.paymentRef) {
      const existing = await Order.findOne({ paymentRef: body.paymentRef }).lean();
      if (existing) {
        return {
          id: String((existing as any)._id),
          orderCode: (existing as any).orderCode,
          totalPaisa: Number((existing as any).totalPaisa || 0),
        };
      }
    }

    const qtyByProductId = new Map<string, number>();
    for (const it of body.items) {
      const id = String(it.productId);
      const qty = Math.max(1, Number(it.qty || 1));
      qtyByProductId.set(id, (qtyByProductId.get(id) || 0) + qty);
    }

    const productIds = Array.from(qtyByProductId.keys());

    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name price stock status image images categoryId")
      .lean();

    const productMap = new Map<string, any>(
      products.map((p: any) => [String(p._id), p])
    );

    for (const [pid, qty] of qtyByProductId.entries()) {
      const p: any = productMap.get(pid);
      if (!p) throw new Error(`Product not found: ${pid}`);

      if (String(p.status) !== "Active") {
        throw new Error(`Product is inactive: ${p.name}`);
      }

      if (Number(p.stock || 0) < qty) {
        throw new Error(
          `Out of stock: ${p.name} (Available: ${p.stock}, Requested: ${qty})`
        );
      }
    }

    let subtotalPaisa = 0;

    const orderItems = body.items.map((i) => {
      const p = productMap.get(String(i.productId));
      if (!p) throw new Error(`Product not found: ${i.productId}`);

      const qty = Math.max(1, Number(i.qty || 1));
      const pricePaisa = Math.round(Number(p.price || 0) * 100);

      subtotalPaisa += pricePaisa * qty;

      const image = String(
        p.image || (Array.isArray(p.images) ? p.images[0] : "") || ""
      );

      return {
        productId: new mongoose.Types.ObjectId(i.productId),
        name: p.name,
        size: String(i.size || "").trim(),
        color: String(i.color || "").trim(),
        colorLabel: String(i.colorLabel || "").trim(),
        qty,
        pricePaisa,
        image,
      };
    });

    const shippingPaisa = Math.max(0, Number(body.shippingPaisa || 0));

    let discountPaisa = 0;
    let couponSnapshot: any = null;
    let userCouponId: string | null = null;

    const couponCode = String(body.couponCode || "").trim();

    if (couponCode) {
      const out = await discountService.computeDiscountPaisa({
        userId,
        couponCode,
        items: body.items.map((x) => ({ productId: x.productId, qty: x.qty })),
        productMap,
        subtotalPaisa,
        shippingPaisa,
      });

      discountPaisa = Number(out.discountPaisa || 0);
      userCouponId = out.userCouponId || null;

      if (out.applied) {
        couponSnapshot = {
          code: out.applied.code,
          title: out.applied.title,
          type: out.applied.type,
          scope: out.applied.scope,
          value: out.applied.value,
        };
      }
    }

    const bulkOps = Array.from(qtyByProductId.entries()).map(([pid, qty]) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(pid), stock: { $gte: qty } },
        update: { $inc: { stock: -qty } },
      },
    }));

    const bulkRes = await Product.bulkWrite(bulkOps);

    if ((bulkRes.modifiedCount || 0) !== bulkOps.length) {
      throw new Error("Stock update failed. Please try again.");
    }

    try {
      const updatedProducts = await Product.find({ _id: { $in: productIds } })
        .select("_id name stock")
        .lean();

      for (const p of updatedProducts as any[]) {
        const stock = Number(p.stock || 0);

        if (stock > 0 && stock <= 5) {
          await notificationService.createAdminForAll({
            title: "Low stock alert",
            message: `${p.name} is running low (${stock} left).`,
            type: "stock",
            link: `/admin/products/${String(p._id)}`,
            meta: {
              productId: String(p._id),
              productName: p.name,
              stock,
            },
          });
        }

        if (stock === 0) {
          await notificationService.createAdminForAll({
            title: "Out of stock",
            message: `${p.name} is out of stock.`,
            type: "stock",
            link: `/admin/products/${String(p._id)}`,
            meta: {
              productId: String(p._id),
              productName: p.name,
              stock,
            },
          });
        }
      }
    } catch (e: any) {
      console.log("Low stock notification failed (ignored):", e?.message);
    }

    const totalPaisa = Math.max(0, subtotalPaisa + shippingPaisa - discountPaisa);
    const orderCode = await generateUniqueOrderCode();

    let orderAddress: any = null;

    if (body.addressId && mongoose.Types.ObjectId.isValid(body.addressId)) {
      const saved = await Address.findOne({
        _id: body.addressId,
        userId: new mongoose.Types.ObjectId(userId),
      }).lean();

      if (!saved) throw new Error("Address not found");

      orderAddress = {
        label: saved.label,
        email: saved.email || "",
        firstName: saved.firstName || "",
        lastName: saved.lastName || "",
        fullName: `${saved.firstName || ""} ${saved.lastName || ""}`.trim(),
        phone: saved.phone,
        country: saved.country || "Nepal",
        provinceId: saved.provinceId || "",
        district: saved.district || "",
        cityOrMunicipality: saved.cityOrMunicipality || "",
        addressLine: saved.addressLine || "",
        street: saved.street || "",
        postalCode: saved.postalCode || "",
        isDefault: Boolean(saved.isDefault),
        lat: normalizeNumber((saved as any).lat),
        lng: normalizeNumber((saved as any).lng),
      };
    } else if (body.address) {
      orderAddress = {
        label: body.address.label,
        fullName: body.address.fullName || "",
        phone: body.address.phone,
        cityOrMunicipality: body.address.city || "",
        district: "",
        provinceId: "",
        addressLine: `${body.address.area || ""}`.trim(),
        street: body.address.street || "",
        postalCode: "",
        country: "Nepal",
        lat: normalizeNumber(body.address.lat),
        lng: normalizeNumber(body.address.lng),
      };
    }

    const estimatedDelivery = computeEstimatedDeliveryRange();

    const initialPaymentStatus: "Paid" | "Pending" | "Failed" =
      body.paymentMethod === "COD" ? "Pending" : "Pending";

    const payload: any = {
      orderCode,
      customer: new mongoose.Types.ObjectId(userId),
      items: orderItems,
      subtotalPaisa,
      shippingPaisa,
      discountPaisa,
      coupon: couponSnapshot || null,
      totalPaisa,
      paymentMethod: body.paymentMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: "Pending",
      paymentRef: body.paymentRef || null,
      address: orderAddress,
      shipping: {
        method: "Standard Shipping",
        estimatedDelivery,
      },
      deliveryAssignment: null,
      shippedAt: null,
      inTransitAt: null,
      deliveredAt: null,
      invoiceNo: null,
      invoiceSentAt: null,
    };

    const doc: any = await Order.create(payload);

    try {
      await notificationService.createAdminForAll({
        title: "New order received",
        message: `A new order ${orderCode} has been placed.`,
        type: "order",
        link: `/admin/orders/${String(doc._id)}`,
        meta: {
          orderId: String(doc._id),
          orderCode,
          customerId: userId,
          totalPaisa,
        },
      });
    } catch (e: any) {
      console.log("Admin notification create failed (ignored):", e?.message);
    }

    try {
      await notificationService.createCustomer({
        userId,
        title: "Order placed successfully",
        message: `Your order ${orderCode} has been placed successfully.`,
        type: "order",
        link: orderDetailsLink(orderCode),
        meta: {
          orderId: String(doc._id),
          orderCode,
        },
      });
    } catch (e: any) {
      console.log("Customer notification create failed (ignored):", e?.message);
    }

    if (userCouponId) {
      await discountService.markUsed(userCouponId, String(doc._id));
    }

    try {
      await maybeSendInvoiceForOrder(String(doc._id));
    } catch (e: any) {
      console.log("Invoice send failed (ignored):", e?.message);
    }

    return {
      id: String(doc._id),
      orderCode: doc.orderCode,
      totalPaisa: Number(doc.totalPaisa || 0),
      discountPaisa: Number(doc.discountPaisa || 0),
      coupon: doc.coupon || null,
      shipping: {
        method: doc.shipping?.method || "Standard Shipping",
        estimatedDelivery: doc.shipping?.estimatedDelivery || estimatedDelivery,
      },
    };
  },

  async listOrders(input: ListInput) {
    const { search = "", customerId, paymentStatus, orderStatus } = input;
    const filter: any = {};

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      filter.customer = new mongoose.Types.ObjectId(customerId);
    }
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (orderStatus) filter.orderStatus = orderStatus;

    if (search.trim()) {
      const rx = safeRegex(search.trim());
      const users = await User.find(
        { $or: [{ name: rx }, { email: rx }] },
        { _id: 1 }
      ).lean();
      const userIds = users.map((u: any) => u._id);

      filter.$or = [
        { orderCode: rx },
        ...(userIds.length ? [{ customer: { $in: userIds } }] : []),
      ];
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return (orders as any[]).map((o: any) => ({
      id: String(o._id),
      orderCode: o.orderCode || "",
      subtotalPaisa: Number(o.subtotalPaisa || 0),
      shippingPaisa: Number(o.shippingPaisa || 0),
      totalPaisa: Number(o.totalPaisa || 0),
      discountPaisa: Number(o.discountPaisa || 0),
      coupon: o.coupon || null,
      paymentMethod: o.paymentMethod || "COD",
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      paymentRef: o.paymentRef || null,
      createdAt: o.createdAt,
      customer: o.customer
        ? {
            id: String(o.customer._id),
            name: o.customer.name || "",
            email: o.customer.email || "",
            phone: o.customer.phone || "",
          }
        : { id: "", name: "", email: "", phone: "" },
      shipping: o.shipping || null,
      address: o.address || null,
      deliveryAssignment: o.deliveryAssignment
        ? {
            ...o.deliveryAssignment,
            deliveryManId: o.deliveryAssignment.deliveryManId
              ? String(o.deliveryAssignment.deliveryManId)
              : "",
          }
        : null,
      invoiceNo: o.invoiceNo || null,
      invoiceSentAt: o.invoiceSentAt || null,
    }));
  },

  async getMyOrdersSummary(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const orders = await Order.find({
      customer: new mongoose.Types.ObjectId(userId),
    })
      .select("orderCode createdAt orderStatus totalPaisa items")
      .sort({ createdAt: -1 })
      .lean();

    return (orders as any[]).map((o: any) => {
      const items = Array.isArray(o.items) ? o.items : [];
      const previewImage =
        items.find((it: any) => String(it?.image || "").trim())?.image || "";

      return {
        id: String(o._id),
        orderCode: String(o.orderCode || ""),
        createdAt: o.createdAt,
        orderStatus: String(o.orderStatus || "Pending"),
        totalPaisa: Number(o.totalPaisa || 0),
        total: Math.round(Number(o.totalPaisa || 0) / 100),
        itemsCount: items.length,
        items: previewImage ? [{ image: previewImage }] : [],
      };
    });
  },

  async getOrderByIdOrCode(idOrCode: string) {
    const value = String(idOrCode || "").trim();
    if (!value) return null;

    if (mongoose.Types.ObjectId.isValid(value)) {
      const byId = await Order.findById(value)
        .populate("customer", "name email phone")
        .lean();
      if (byId) return this.mapOrder(byId);
    }

    const byCode = await Order.findOne({ orderCode: value })
      .populate("customer", "name email phone")
      .lean();

    if (!byCode) return null;
    return this.mapOrder(byCode);
  },

  async updateOrder(idOrCode: string, input: UpdateInput) {
    const raw = String(idOrCode || "").trim();
    if (!raw) return null;

    const isObjId = mongoose.Types.ObjectId.isValid(raw);

    const found: any = isObjId
      ? await Order.findById(raw).lean()
      : await Order.findOne({ orderCode: raw }).lean();

    if (!found) return null;

    const prevDeliveryManId = found?.deliveryAssignment?.deliveryManId
      ? String(found.deliveryAssignment.deliveryManId)
      : "";
    const prevDeliveryStatus = String(
      found?.deliveryAssignment?.status || ""
    ).trim();

    const update: any = {};
    if (input.paymentStatus) update.paymentStatus = input.paymentStatus;
    if (input.orderStatus) update.orderStatus = input.orderStatus;

    const nextStatus = String(input.orderStatus || "").trim();

    if (nextStatus === "Shipped" && !found.shippedAt) {
      update.shippedAt = new Date();
    }

    if (nextStatus === "Transit" && !found.inTransitAt) {
      update.inTransitAt = new Date();
      if (!found.shippedAt) update.shippedAt = new Date();
    }

    if (nextStatus === "Delivered" && !found.deliveredAt) {
      update.deliveredAt = new Date();
      if (!found.shippedAt) update.shippedAt = new Date();
      if (!found.inTransitAt) update.inTransitAt = new Date();
    }

    if (input.deliveryAssignment) {
      const nextDeliveryAssignment = { ...(found.deliveryAssignment || {}) };
      const now = new Date();

      if (input.deliveryAssignment.deliveryManId) {
        const deliveryManId = String(input.deliveryAssignment.deliveryManId);

        if (!mongoose.Types.ObjectId.isValid(deliveryManId)) {
          throw new Error("Invalid delivery staff id");
        }

        const rider: any = await User.findOne({
          _id: new mongoose.Types.ObjectId(deliveryManId),
          role: "delivery",
        }).lean();

        if (!rider) {
          throw new Error("Delivery staff not found");
        }

        if (String(rider.status || "").toLowerCase() !== "active") {
          throw new Error("Inactive delivery rider cannot be assigned");
        }

        nextDeliveryAssignment.deliveryManId = rider._id;
        nextDeliveryAssignment.name = rider.name || "";
        nextDeliveryAssignment.phone = rider.phone || "";
        nextDeliveryAssignment.email = rider.email || "";
        nextDeliveryAssignment.vehicleType = rider.vehicleType || "";

        if (!nextDeliveryAssignment.assignedAt) {
          nextDeliveryAssignment.assignedAt = new Date();
        }

        if (!nextDeliveryAssignment.status) {
          nextDeliveryAssignment.status = "Assigned";
        }

        if (nextDeliveryAssignment.pickedUpAt === undefined) {
          nextDeliveryAssignment.pickedUpAt = null;
        }

        if (nextDeliveryAssignment.outForDeliveryAt === undefined) {
          nextDeliveryAssignment.outForDeliveryAt = null;
        }

        if (nextDeliveryAssignment.deliveredAt === undefined) {
          nextDeliveryAssignment.deliveredAt = null;
        }

        if (nextDeliveryAssignment.failedAt === undefined) {
          nextDeliveryAssignment.failedAt = null;
        }

        if (nextDeliveryAssignment.returnedAt === undefined) {
          nextDeliveryAssignment.returnedAt = null;
        }
      }

      if (typeof input.deliveryAssignment.note === "string") {
        nextDeliveryAssignment.note = input.deliveryAssignment.note.trim();
      }

      if (input.deliveryAssignment.status) {
        nextDeliveryAssignment.status = input.deliveryAssignment.status;

        if (
          input.deliveryAssignment.status === "Picked Up" &&
          !nextDeliveryAssignment.pickedUpAt
        ) {
          nextDeliveryAssignment.pickedUpAt = now;
        }

        if (
          input.deliveryAssignment.status === "Out for Delivery" &&
          !nextDeliveryAssignment.outForDeliveryAt
        ) {
          nextDeliveryAssignment.outForDeliveryAt = now;
          if (!nextDeliveryAssignment.pickedUpAt) {
            nextDeliveryAssignment.pickedUpAt = now;
          }
          if (!found.inTransitAt) {
            update.inTransitAt = now;
          }
          if (!found.shippedAt) {
            update.shippedAt = now;
          }
          if (!update.orderStatus) {
            update.orderStatus = "Transit";
          }
        }

        if (
          input.deliveryAssignment.status === "Delivered" &&
          !nextDeliveryAssignment.deliveredAt
        ) {
          nextDeliveryAssignment.deliveredAt = now;
          if (!nextDeliveryAssignment.outForDeliveryAt) {
            nextDeliveryAssignment.outForDeliveryAt = now;
          }
          if (!nextDeliveryAssignment.pickedUpAt) {
            nextDeliveryAssignment.pickedUpAt = now;
          }
          if (!found.deliveredAt) {
            update.deliveredAt = now;
          }
          if (!found.inTransitAt) {
            update.inTransitAt = now;
          }
          if (!found.shippedAt) {
            update.shippedAt = now;
          }
          if (!update.orderStatus) {
            update.orderStatus = "Delivered";
          }
        }

        if (
          input.deliveryAssignment.status === "Failed Delivery" &&
          !nextDeliveryAssignment.failedAt
        ) {
          nextDeliveryAssignment.failedAt = now;
        }

        if (
          input.deliveryAssignment.status === "Returned" &&
          !nextDeliveryAssignment.returnedAt
        ) {
          nextDeliveryAssignment.returnedAt = now;
        }
      }

      update.deliveryAssignment = nextDeliveryAssignment;
    }

    const updated: any = await Order.findByIdAndUpdate(found._id, update, {
      new: true,
    })
      .populate("customer", "name email phone")
      .lean();

    if (!updated) return null;

    const updatedOrderId = String(updated._id || found._id);
    const customerId = String((updated as any)?.customer?._id || found.customer || "");
    const orderCode = String(updated.orderCode || "");
    const nextDeliveryManId = updated?.deliveryAssignment?.deliveryManId
      ? String(updated.deliveryAssignment.deliveryManId)
      : "";
    const nextDeliveryStatus = String(
      updated?.deliveryAssignment?.status || ""
    ).trim();

    try {
      if (input.orderStatus) {
        await notificationService.createAdminForAll({
          title: "Order status updated",
          message: `Order ${updated.orderCode} marked as ${updated.orderStatus}.`,
          type: "order",
          link: `/admin/orders/${updatedOrderId}`,
          meta: {
            orderId: updatedOrderId,
            orderCode: updated.orderCode,
            orderStatus: updated.orderStatus,
          },
        });
      }
    } catch (e: any) {
      console.log("Order status notification failed (ignored):", e?.message);
    }

    try {
      if (input.paymentStatus === "Paid" || input.paymentStatus === "Failed") {
        await notificationService.createAdminForAll({
          title:
            input.paymentStatus === "Paid"
              ? "Payment successful"
              : "Payment failed",
          message:
            input.paymentStatus === "Paid"
              ? `Payment received for order ${updated.orderCode}.`
              : `Payment failed for order ${updated.orderCode}.`,
          type: "payment",
          link: `/admin/orders/${updatedOrderId}`,
          meta: {
            orderId: updatedOrderId,
            orderCode: updated.orderCode,
            paymentStatus: input.paymentStatus,
          },
        });
      }
    } catch (e: any) {
      console.log("Payment notification failed (ignored):", e?.message);
    }

    try {
      if (nextDeliveryManId && nextDeliveryManId !== prevDeliveryManId) {
        await notificationService.createDelivery({
          userId: nextDeliveryManId,
          title: prevDeliveryManId ? "Order Reassigned" : "New Delivery Assigned",
          message: prevDeliveryManId
            ? `Order ${orderCode} has been reassigned to you.`
            : `Order ${orderCode} has been assigned to you for delivery.`,
          type: "order",
          link: deliveryOrderLink(updatedOrderId),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            deliveryStatus: nextDeliveryStatus || "Assigned",
            action: prevDeliveryManId ? "delivery_reassigned" : "delivery_assigned",
          },
        });

        if (prevDeliveryManId) {
          await notificationService.createDelivery({
            userId: prevDeliveryManId,
            title: "Order Reassigned",
            message: `Order ${orderCode} is no longer assigned to you.`,
            type: "order",
            link: "/delivery/orders",
            meta: {
              orderId: updatedOrderId,
              orderCode,
              action: "delivery_reassigned_away",
            },
          });
        }

        if (customerId) {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Order Assigned to Delivery Rider",
            message: `Your order ${orderCode} has been assigned to a delivery rider.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              action: "delivery_assigned",
            },
          });
        }
      }
    } catch (e: any) {
      console.log("Delivery assignment notification failed (ignored):", e?.message);
    }

    try {
      if (
        nextDeliveryStatus &&
        nextDeliveryStatus !== prevDeliveryStatus &&
        customerId
      ) {
        if (nextDeliveryStatus === "Picked Up") {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Order Picked Up",
            message: `Your order ${orderCode} has been picked up by the delivery rider.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              deliveryStatus: nextDeliveryStatus,
              action: "delivery_picked_up",
            },
          });
        } else if (nextDeliveryStatus === "Out for Delivery") {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Out for Delivery",
            message: `Your order ${orderCode} is out for delivery.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              deliveryStatus: nextDeliveryStatus,
              action: "delivery_out_for_delivery",
            },
          });
        } else if (nextDeliveryStatus === "Delivered") {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Order Delivered",
            message: `Your order ${orderCode} has been delivered. Thank you for shopping with us!`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              deliveryStatus: nextDeliveryStatus,
              action: "delivery_delivered",
            },
          });
        } else if (nextDeliveryStatus === "Failed Delivery") {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Delivery Failed",
            message: `Delivery attempt failed for order ${orderCode}.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              deliveryStatus: nextDeliveryStatus,
              action: "delivery_failed",
            },
          });
        } else if (nextDeliveryStatus === "Returned") {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Order Returned",
            message: `Your order ${orderCode} has been returned.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              deliveryStatus: nextDeliveryStatus,
              action: "delivery_returned",
            },
          });
        }
      }
    } catch (e: any) {
      console.log("Customer delivery status notification failed (ignored):", e?.message);
    }

    try {
      if (input.paymentStatus === "Paid") {
        await maybeSendInvoiceForOrder(String(found._id));
      }
    } catch (e: any) {
      console.log("Invoice send failed (ignored):", e?.message);
    }

    return this.mapOrder(updated);
  },

  mapOrder(o: any) {
    return {
      id: String(o._id),
      orderCode: o.orderCode || "",
      subtotalPaisa: Number(o.subtotalPaisa || 0),
      shippingPaisa: Number(o.shippingPaisa || 0),
      discountPaisa: Number(o.discountPaisa || 0),
      totalPaisa: Number(o.totalPaisa || 0),
      coupon: o.coupon || null,
      paymentMethod: o.paymentMethod || "COD",
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      paymentRef: o.paymentRef || null,
      createdAt: o.createdAt,
      customer: o.customer
        ? {
            id: String(o.customer._id),
            name: o.customer.name || "",
            email: o.customer.email || "",
            phone: o.customer.phone || "",
          }
        : { id: "", name: "", email: "", phone: "" },
      items: Array.isArray(o.items)
        ? o.items.map((it: any) => ({
            ...it,
            color: it?.color || "",
            colorLabel: it?.colorLabel || "",
          }))
        : [],
      address: o.address
        ? {
            ...o.address,
            lat:
              typeof o.address.lat === "number" && Number.isFinite(o.address.lat)
                ? o.address.lat
                : undefined,
            lng:
              typeof o.address.lng === "number" && Number.isFinite(o.address.lng)
                ? o.address.lng
                : undefined,
          }
        : null,
      shipping: o.shipping || null,
      deliveryAssignment: o.deliveryAssignment
        ? {
            ...o.deliveryAssignment,
            deliveryManId: o.deliveryAssignment.deliveryManId
              ? String(o.deliveryAssignment.deliveryManId)
              : "",
          }
        : null,
      shippedAt: o.shippedAt || null,
      inTransitAt: o.inTransitAt || null,
      deliveredAt: o.deliveredAt || null,
      invoiceNo: o.invoiceNo || null,
      invoiceSentAt: o.invoiceSentAt || null,
    };
  },

  async getMyOrderDetails(userId: string, idOrCode: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

    const raw = String(idOrCode || "").trim();
    if (!raw) return null;

    const normalizedCode = raw.startsWith("#") ? raw : `#${raw}`;

    const filter: any = {
      customer: new mongoose.Types.ObjectId(userId),
      $or: [{ orderCode: normalizedCode }],
    };

    if (mongoose.Types.ObjectId.isValid(raw)) {
      filter.$or.push({ _id: new mongoose.Types.ObjectId(raw) });
    }

    const o: any = await Order.findOne(filter)
      .populate("customer", "name email phone")
      .lean();
    if (!o) return null;

    const customerName = o.customer?.name || "";
    const customerEmail = o.customer?.email || "";

    const addr = o.address || null;
    const shippingAddress = buildShippingAddressText(addr);

    const items = (Array.isArray(o.items) ? o.items : []).map(
      (it: any, idx: number) => ({
        id: String(it.productId || idx),
        name: it.name || "",
        size: it.size || "",
        color: it.color || "",
        colorLabel: it.colorLabel || "",
        qty: Number(it.qty || 0),
        price: Math.round(Number(it.pricePaisa || 0) / 100),
        image: it.image || "",
      })
    );

    const subtotal = Math.round(Number(o.subtotalPaisa || 0) / 100);
    const shipping = Math.round(Number(o.shippingPaisa || 0) / 100);
    const discount = Math.round(Number(o.discountPaisa || 0) / 100);
    const total = Math.round(Number(o.totalPaisa || 0) / 100);

    const status = (o.orderStatus || "Pending") as any;

    const shipMethod = o.shipping?.method || "Standard Shipping";
    const estDelivery =
      (o.shipping?.estimatedDelivery &&
        String(o.shipping.estimatedDelivery).trim()) ||
      computeEstimatedDeliveryRange();

    return {
      orderId: o.orderCode || normalizedCode,
      status,
      customer: {
        name: customerName,
        email: customerEmail,
        shippingAddress,
      },
      items,
      payment: { method: o.paymentMethod || "COD" },
      shipping: { method: shipMethod, estimatedDelivery: estDelivery },
      summary: { subtotal, shipping, discount, taxes: 0, total },
      coupon: o.coupon || null,
      invoiceNo: o.invoiceNo || null,
      invoiceSentAt: o.invoiceSentAt || null,
      address: o.address
        ? {
            ...o.address,
            lat:
              typeof o.address.lat === "number" && Number.isFinite(o.address.lat)
                ? o.address.lat
                : undefined,
            lng:
              typeof o.address.lng === "number" && Number.isFinite(o.address.lng)
                ? o.address.lng
                : undefined,
          }
        : null,
      deliveryAssignment: o.deliveryAssignment
        ? {
            ...o.deliveryAssignment,
            deliveryManId: o.deliveryAssignment.deliveryManId
              ? String(o.deliveryAssignment.deliveryManId)
              : "",
          }
        : null,
    };
  },

  async trackOrder(code: string) {
    const raw = String(code || "").trim();
    if (!raw) return null;

    const orderCode = raw.startsWith("#") ? raw : `#${raw}`;

    const o: any = await Order.findOne({ orderCode })
      .populate("customer", "name email phone")
      .select(
        [
          "orderCode",
          "orderStatus",
          "createdAt",
          "updatedAt",
          "shippedAt",
          "inTransitAt",
          "deliveredAt",
          "shipping",
          "deliveryAssignment",
          "paymentMethod",
          "subtotalPaisa",
          "shippingPaisa",
          "totalPaisa",
          "address",
          "items",
        ].join(" ")
      )
      .lean();

    if (!o) return null;

    const items = (Array.isArray(o.items) ? o.items : []).map(
      (it: any, idx: number) => ({
        id: String(it.productId || idx),
        name: it.name || "",
        size: it.size || "",
        color: it.color || "",
        colorLabel: it.colorLabel || "",
        qty: Number(it.qty || 0),
        price: Math.round(Number(it.pricePaisa || 0) / 100),
        image: it.image || "",
      })
    );

    return {
      orderCode: o.orderCode,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      shippedAt: o.shippedAt || null,
      inTransitAt: o.inTransitAt || null,
      deliveredAt: o.deliveredAt || null,
      shipping: {
        method: o.shipping?.method || "Standard Shipping",
        estimatedDelivery:
          o.shipping?.estimatedDelivery || computeEstimatedDeliveryRange(),
      },
      customer: o.customer
        ? {
            name: o.customer.name || "",
            email: o.customer.email || "",
            shippingAddress: buildShippingAddressText(o.address),
          }
        : {
            name: "",
            email: "",
            shippingAddress: buildShippingAddressText(o.address),
          },
      payment: {
        method: o.paymentMethod || "COD",
      },
      summary: {
        subtotal: Math.round(Number(o.subtotalPaisa || 0) / 100),
        shipping: Math.round(Number(o.shippingPaisa || 0) / 100),
        taxes: 0,
        total: Math.round(Number(o.totalPaisa || 0) / 100),
      },
      items,
      deliveryAssignment: o.deliveryAssignment
        ? {
            ...o.deliveryAssignment,
            deliveryManId: o.deliveryAssignment.deliveryManId
              ? String(o.deliveryAssignment.deliveryManId)
              : "",
          }
        : null,
    };
  },
};

export default orderService;