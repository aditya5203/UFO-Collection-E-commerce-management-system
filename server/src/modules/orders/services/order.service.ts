// server/src/modules/orders/services/order.service.ts

import mongoose from "mongoose";
import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";
import { Address } from "../../../models/Address.model";

// ✅ NEW: discount service
import discountService from "../../discounts/services/discount.service";

type ListInput = {
  search?: string;
  customerId?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

type UpdateInput = {
  paymentStatus?: string;
  orderStatus?: string;
};

type CreateOrderBody = {
  paymentMethod: "COD" | "Khalti" | "eSewa";
  paymentRef?: string;
  shippingPaisa?: number;

  // ✅ NEW
  couponCode?: string;

  items: Array<{
    productId: string;
    size?: string;
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
  };
};

function safeRegex(input: string) {
  return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
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

export const orderService = {
  // =======================================================
  // CREATE ORDER (Customer) ✅ + STOCK DECREASE + DISCOUNT ✅
  // =======================================================
  async createOrder(userId: string, body: CreateOrderBody) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");
    if (!body?.items?.length) throw new Error("Cart is empty");
    if (!body.paymentMethod) throw new Error("paymentMethod is required");

    // Prevent duplicate order for same paymentRef
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

    // ✅ Combine quantities per productId (important)
    const qtyByProductId = new Map<string, number>();
    for (const it of body.items) {
      const id = String(it.productId);
      const qty = Math.max(1, Number(it.qty || 1));
      qtyByProductId.set(id, (qtyByProductId.get(id) || 0) + qty);
    }

    const productIds = Array.from(qtyByProductId.keys());

    // ✅ Fetch products with stock + status + categoryId (needed for category coupons)
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name price stock status image images categoryId")
      .lean();

    const productMap = new Map<string, any>(
      products.map((p: any) => [String(p._id), p])
    );

    // ✅ Validate products exist + Active + enough stock
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

    // ✅ Build order items and compute subtotal FIRST
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
        size: i.size || "",
        qty,
        pricePaisa,
        image,
      };
    });

    const shippingPaisa = Math.max(0, Number(body.shippingPaisa || 0));

    // ✅ APPLY COUPON BEFORE STOCK DECREASE (IMPORTANT)
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

    // ✅ Decrease stock atomically (safe from race conditions)
    const bulkOps = Array.from(qtyByProductId.entries()).map(([pid, qty]) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(pid), stock: { $gte: qty } },
        update: { $inc: { stock: -qty } },
      },
    }));

    const bulkRes = await Product.bulkWrite(bulkOps);

    // If any update didn't happen -> stock changed by another order
    if ((bulkRes.modifiedCount || 0) !== bulkOps.length) {
      throw new Error("Stock update failed. Please try again.");
    }

    // ✅ Final total after discount
    const totalPaisa = Math.max(0, subtotalPaisa + shippingPaisa - discountPaisa);

    const orderCode = await generateUniqueOrderCode();

    // Address snapshot
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
      };
    }

    const estimatedDelivery = computeEstimatedDeliveryRange();

    const payload: any = {
      orderCode,
      customer: new mongoose.Types.ObjectId(userId),
      items: orderItems,

      subtotalPaisa,
      shippingPaisa,

      // ✅ NEW: discount snapshot
      discountPaisa,
      coupon: couponSnapshot || null,

      totalPaisa,

      paymentMethod: body.paymentMethod,
      paymentStatus: "Pending",
      orderStatus: "Pending",
      paymentRef: body.paymentRef || null,

      address: orderAddress,
      shipping: {
        method: "Standard Shipping",
        estimatedDelivery,
      },
    };

    const doc: any = await Order.create(payload);

    // ✅ Mark coupon used ONLY after order success
    if (userCouponId) {
      await discountService.markUsed(userCouponId, String(doc._id));
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

  // =======================================================
  // LIST ORDERS (Admin)
  // =======================================================
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
      .populate("customer", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return (orders as any[]).map((o: any) => ({
      id: String(o._id),
      orderCode: o.orderCode || "",
      totalPaisa: Number(o.totalPaisa || 0),
      discountPaisa: Number(o.discountPaisa || 0),
      coupon: o.coupon || null,
      paymentMethod: o.paymentMethod || "COD",
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      customer: o.customer
        ? {
            id: String(o.customer._id),
            name: o.customer.name || "",
            email: o.customer.email || "",
          }
        : { id: "", name: "", email: "" },
      shipping: o.shipping || null,
    }));
  },

  // =======================================================
  // GET ORDER (Admin) by MongoId or OrderCode
  // =======================================================
  async getOrderByIdOrCode(idOrCode: string) {
    const value = String(idOrCode || "").trim();
    if (!value) return null;

    if (mongoose.Types.ObjectId.isValid(value)) {
      const byId = await Order.findById(value)
        .populate("customer", "name email")
        .lean();
      if (byId) return this.mapOrder(byId);
    }

    const byCode = await Order.findOne({ orderCode: value })
      .populate("customer", "name email")
      .lean();

    if (!byCode) return null;
    return this.mapOrder(byCode);
  },

  // =======================================================
  // UPDATE ORDER (Admin)
  // =======================================================
  async updateOrder(id: string, input: UpdateInput) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const update: any = {};
    if (input.paymentStatus) update.paymentStatus = input.paymentStatus;
    if (input.orderStatus) update.orderStatus = input.orderStatus;

    const updated = await Order.findByIdAndUpdate(id, update, { new: true })
      .populate("customer", "name email")
      .lean();

    if (!updated) return null;
    return this.mapOrder(updated);
  },

  // =======================================================
  // MAP ORDER (Admin response)
  // =======================================================
  mapOrder(o: any) {
    return {
      id: String(o._id),
      orderCode: o.orderCode || "",
      totalPaisa: Number(o.totalPaisa || 0),
      discountPaisa: Number(o.discountPaisa || 0),
      coupon: o.coupon || null,
      paymentMethod: o.paymentMethod || "COD",
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      customer: o.customer
        ? {
            id: String(o.customer._id),
            name: o.customer.name || "",
            email: o.customer.email || "",
          }
        : { id: "", name: "", email: "" },
      items: Array.isArray(o.items) ? o.items : [],
      address: o.address || null,
      shipping: o.shipping || null,
    };
  },

  // =======================================================
  // CUSTOMER ORDER DETAILS (Customer only)
  // GET /api/orders/my/:id
  // =======================================================
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
      .populate("customer", "name email")
      .lean();
    if (!o) return null;

    const customerName = o.customer?.name || "";
    const customerEmail = o.customer?.email || "";

    const addr = o.address || null;
    const shippingAddress = addr
      ? [
          (addr.fullName ||
            `${addr.firstName || ""} ${addr.lastName || ""}`.trim()
          ).trim(),
          addr.phone || "",
          `${addr.cityOrMunicipality || ""}${
            addr.district ? ", " + addr.district : ""
          }`,
          `${addr.addressLine || ""}${addr.street ? ", " + addr.street : ""}`,
          `${addr.provinceId || ""}${
            addr.postalCode ? " " + addr.postalCode : ""
          }`,
          addr.country || "Nepal",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const items = (Array.isArray(o.items) ? o.items : []).map(
      (it: any, idx: number) => ({
        id: String(it.productId || idx),
        name: it.name || "",
        size: it.size || "",
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
    };
  },

  // =======================================================
  // TRACK ORDER (Public)
  // GET /api/orders/track/:code
  // =======================================================
  async trackOrder(code: string) {
    const raw = String(code || "").trim();
    if (!raw) return null;

    const orderCode = raw.startsWith("#") ? raw : `#${raw}`;

    const o: any = await Order.findOne({ orderCode })
      .select("orderCode orderStatus createdAt shipping")
      .lean();

    if (!o) return null;

    return {
      orderCode: o.orderCode,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      shipping: {
        method: o.shipping?.method || "Standard Shipping",
        estimatedDelivery:
          o.shipping?.estimatedDelivery || computeEstimatedDeliveryRange(),
      },
    };
  },
};

export default orderService;
