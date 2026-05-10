import mongoose from "mongoose";
import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";
import { Address } from "../../../models/Address.model";
import discountService from "../../discounts/services/discount.service";
import { maybeSendInvoiceForOrder } from "../../../services/invoiceWorkflow.service";
import { notificationService } from "../../notifications/services/notification.service";
import { getIO } from "../../../socket";

type ListInput = {
  search?: string;
  customerId?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

type DeliveryStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

type DeliveryTaskType =
  | "NORMAL_DELIVERY"
  | "RETURN_PICKUP"
  | "EXCHANGE_PICKUP"
  | "REPLACEMENT_DELIVERY";

type UpdateInput = {
  paymentStatus?: string;
  orderStatus?: string;
  deliveryAssignment?: {
    deliveryManId?: string;
    note?: string;
    status?: DeliveryStatus;
  };
};

type CreateOrderBody = {
  paymentMethod: "COD" | "Khalti" | "eSewa" | "Fonepay";
  paymentRef?: string;
  paymentStatus?: "Paid" | "Pending" | "Failed";
  shippingPaisa?: number;
  couponCode?: string;
  items: Array<{
    productId: string;
    variantId?: string | null;
    size?: string;
    color?: string;
    colorLabel?: string;
    sku?: string | null;
    qty: number;
  }>;
  addressId?: string;
  address?: {
    label?: "Home" | "Work" | "Other";
    email?: string;
    fullName: string;
    phone: string;
    provinceId?: string;
    district?: string;
    city: string;
    area?: string;
    addressLine?: string;
    street: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
  };
};

type RequestCancellationInput = {
  userId: string;
  idOrCode: string;
  reason: string;
};

type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

type PreferredResolution = "REFUND" | "EXCHANGE";

type RequestReturnInput = {
  userId: string;
  idOrCode: string;
  reason: string;
  type?: ReturnRequestType;
  preferredResolution?: PreferredResolution;
  images?: string[];
};

type AdminRequestActionInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

type AssignPickupInput = {
  adminId: string;
  idOrCode: string;
  deliveryManId: string;
  note?: string;
};

type MarkPickupStatusInput = {
  deliveryManId: string;
  idOrCode: string;
  taskType?: DeliveryTaskType;
  status: DeliveryStatus;
  note?: string;
  photo?: string;
};

type MarkProductReceivedInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

type RequestRefundDetailsInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

type SubmitRefundDetailsInput = {
  userId: string;
  idOrCode: string;
  method: "BANK" | "KHALTI" | "ESEWA" | "FONEPAY" | "Bank" | "Khalti" | "eSewa" | "Fonepay";
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  walletNumber?: string;
  walletId?: string;
  customerNote?: string;
};

type MarkRefundProcessingInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

type MarkRefundedInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
  transactionRef?: string;
};

type AssignReplacementDeliveryInput = {
  adminId: string;
  idOrCode: string;
  deliveryManId: string;
  note?: string;
};

type CompleteExchangeInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

type ListReturnsRefundsInput = {
  type?: string;
  status?: string;
  search?: string;
};

function safeRegex(input: string) {
  return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function normalizeNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeHexColor(value: any) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSize(value: any) {
  return String(value || "").trim().toUpperCase();
}

function getVariantId(variant: any) {
  return String(variant?._id || variant?.id || "").trim();
}

function norm(value: any) {
  return String(value || "").trim().toLowerCase();
}

function isPaidLike(value: any) {
  const v = norm(value);
  return ["paid", "success", "successful", "completed"].includes(v);
}

function getRefundMethod(paymentMethod: any) {
  const method = String(paymentMethod || "").trim();

  if (["COD", "Khalti", "eSewa", "Fonepay"].includes(method)) {
    return method;
  }

  return "Manual";
}

function orderDetailsLink(orderCode: string) {
  const clean = String(orderCode || "").replace(/^#/, "").trim();
  return clean ? `/customerorderdetails/${clean}` : "/profile/orders";
}

function deliveryOrderLink(orderId: string) {
  return `/delivery/orders/${orderId}`;
}

function adminOrderLink(orderId: string) {
  return `/admin/orders/${orderId}`;
}

function adminReturnsRefundsLink() {
  return "/admin/returns-refunds";
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
    `${address.provinceId || ""}${
      address.postalCode ? " " + address.postalCode : ""
    }`,
    address.country || "Nepal",
  ]
    .filter(Boolean)
    .join("\n");
}

function computeEstimatedDeliveryRange() {
  const today = new Date();

  const from = new Date(today);
  from.setDate(today.getDate() + 3);

  const to = new Date(today);
  to.setDate(today.getDate() + 4);

  const sameMonth =
    from.getMonth() === to.getMonth() &&
    from.getFullYear() === to.getFullYear();

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

async function generateUniqueOrderCode() {
  for (let i = 0; i < 10; i++) {
    const code = `#${Math.floor(100000 + Math.random() * 900000)}`;
    const exists = await Order.findOne({ orderCode: code }).lean();
    if (!exists) return code;
  }

  return `#${Date.now().toString().slice(-6)}`;
}

function findMatchingVariant(product: any, item: any) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  if (!variants.length) return null;

  const requestedVariantId = String(item?.variantId || "").trim();
  const requestedColor = normalizeHexColor(item?.color);
  const requestedSize = normalizeSize(item?.size);

  if (
    requestedVariantId &&
    mongoose.Types.ObjectId.isValid(requestedVariantId)
  ) {
    const byId = variants.find(
      (variant: any) => getVariantId(variant) === requestedVariantId
    );

    if (byId) return byId;
  }

  return (
    variants.find((variant: any) => {
      const variantColor = normalizeHexColor(variant?.color);
      const variantSize = normalizeSize(variant?.size);

      return variantColor === requestedColor && variantSize === requestedSize;
    }) || null
  );
}

async function findOrderByIdOrCodeRaw(idOrCode: string) {
  const raw = String(idOrCode || "").trim();
  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byId = await Order.findById(raw).lean();
    if (byId) return byId;
  }

  const normalizedCode = raw.startsWith("#") ? raw : `#${raw}`;

  return Order.findOne({ orderCode: normalizedCode }).lean();
}

async function findCustomerOrderRaw(userId: string, idOrCode: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user");
  }

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

  return Order.findOne(filter).lean();
}

async function notifyAdmin(payload: {
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, any>;
}) {
  try {
    await notificationService.createAdminForAll({
      title: payload.title,
      message: payload.message,
      type: "order",
      link: payload.link || adminReturnsRefundsLink(),
      meta: payload.meta || {},
    });
  } catch (e: any) {
    console.log("Admin notification failed (ignored):", e?.message);
  }
}

async function notifyCustomer(payload: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, any>;
  type?: "order" | "payment";
}) {
  try {
    await notificationService.createCustomer({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "order",
      link: payload.link,
      meta: payload.meta || {},
    });
  } catch (e: any) {
    console.log("Customer notification failed (ignored):", e?.message);
  }
}

async function notifyDelivery(payload: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, any>;
}) {
  try {
    await notificationService.createDelivery({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: "order",
      link: payload.link,
      meta: payload.meta || {},
    });
  } catch (e: any) {
    console.log("Delivery notification failed (ignored):", e?.message);
  }
}

async function emitOrderUpdated(updated: any, fallbackCustomerId?: string) {
  try {
    const io = getIO();

    const customerId = String(
      updated?.customer?._id || updated?.customer || fallbackCustomerId || ""
    ).trim();

    const normalizeAssignment = (assignment: any) =>
      assignment
        ? {
            ...assignment,
            deliveryManId: assignment.deliveryManId
              ? String(assignment.deliveryManId)
              : "",
          }
        : null;

    const payload = {
      orderId: String(updated._id),
      orderCode: String(updated.orderCode || ""),
      orderStatus: String(updated.orderStatus || ""),
      paymentStatus: String(updated.paymentStatus || ""),
      cancelRequest: updated.cancelRequest || { status: "NONE" },
      returnRequest: updated.returnRequest || { status: "NONE" },
      refund: updated.refund || { status: "NONE" },
      exchange: updated.exchange || { status: "NONE" },
      deliveryAssignment: normalizeAssignment(updated.deliveryAssignment),
      returnPickupAssignment: normalizeAssignment(updated.returnPickupAssignment),
      exchangePickupAssignment: normalizeAssignment(updated.exchangePickupAssignment),
      replacementDeliveryAssignment: normalizeAssignment(
        updated.replacementDeliveryAssignment
      ),
      updatedAt: new Date().toISOString(),
      source: "order-service",
    };

    io.to("admins").emit("order:updated", payload);
    io.to(`admin:order:${String(updated._id)}`).emit("order:updated", payload);

    if (customerId) {
      io.to(`user:${customerId}`).emit("order:updated", payload);
    }
  } catch (e: any) {
    console.log("Order socket emit failed (ignored):", e?.message);
  }
}

function buildOrderCreatedPayload(doc: any, userId: string) {
  return {
    orderId: String(doc._id),
    orderCode: String(doc.orderCode || ""),
    orderStatus: String(doc.orderStatus || "Confirmed"),
    paymentStatus: String(doc.paymentStatus || "Pending"),
    totalPaisa: Number(doc.totalPaisa || 0),
    customerId: userId,
    cancelRequest: doc.cancelRequest || { status: "NONE" },
    returnRequest: doc.returnRequest || { status: "NONE" },
    refund: doc.refund || { status: "NONE" },
    exchange: doc.exchange || { status: "NONE" },
    updatedAt: new Date().toISOString(),
    source: "customer-create",
  };
}

async function restockOrderItems(order: any) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) return;

  const bulkOps: any[] = [];

  for (const item of items) {
    const productId = String(item?.productId || "");
    const variantId = String(item?.variantId || "");
    const qty = Math.max(0, Number(item?.qty || 0));

    if (!qty || !mongoose.Types.ObjectId.isValid(productId)) continue;

    if (variantId && mongoose.Types.ObjectId.isValid(variantId)) {
      bulkOps.push({
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(productId),
            "variants._id": new mongoose.Types.ObjectId(variantId),
          },
          update: {
            $inc: {
              stock: qty,
              "variants.$.stock": qty,
            },
          },
        },
      });
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(productId) },
          update: { $inc: { stock: qty } },
        },
      });
    }
  }

  if (bulkOps.length) {
    await Product.bulkWrite(bulkOps);
  }
}

function buildRefundAfterCancellation(order: any) {
  const paid = isPaidLike(order?.paymentStatus);
  const totalPaisa = Number(order?.totalPaisa || 0);

  if (!paid || totalPaisa <= 0) {
    return {
      status: "NONE",
      amountPaisa: 0,
      method: "",
      requestedAt: null,
      requestedDetailsAt: null,
      detailsSubmittedAt: null,
      processedAt: null,
      refundedAt: null,
      failedAt: null,
      adminNote: "",
      customerNote: "",
      processedBy: null,
      transactionRef: "",
    };
  }

  return {
    status: "PENDING",
    amountPaisa: totalPaisa,
    method: getRefundMethod(order?.paymentMethod),
    requestedAt: new Date(),
    requestedDetailsAt: null,
    detailsSubmittedAt: null,
    processedAt: null,
    refundedAt: null,
    failedAt: null,
    adminNote: "",
    customerNote: "",
    processedBy: null,
    transactionRef: "",
  };
}

function buildRefundAfterProductReceived(order: any) {
  const paid = isPaidLike(order?.paymentStatus);
  const totalPaisa = Number(order?.totalPaisa || 0);

  if (!paid || totalPaisa <= 0) {
    return {
      status: "NONE",
      amountPaisa: 0,
      method: "",
      requestedAt: null,
      requestedDetailsAt: null,
      detailsSubmittedAt: null,
      processedAt: null,
      refundedAt: null,
      failedAt: null,
      adminNote: "",
      customerNote: "",
      processedBy: null,
      transactionRef: "",
    };
  }

  return {
    status: "PENDING_ACCOUNT_DETAILS",
    amountPaisa: totalPaisa,
    method: getRefundMethod(order?.paymentMethod),
    requestedAt: new Date(),
    requestedDetailsAt: null,
    detailsSubmittedAt: null,
    processedAt: null,
    refundedAt: null,
    failedAt: null,
    adminNote: "",
    customerNote: "",
    processedBy: null,
    transactionRef: "",
  };
}

function isReturnWindowAllowed(order: any) {
  if (String(order?.orderStatus || "") !== "Delivered") return false;

  const deliveredAt = order?.deliveredAt;
  if (!deliveredAt) return true;

  const deliveredDate = new Date(deliveredAt);
  if (Number.isNaN(deliveredDate.getTime())) return true;

  const now = Date.now();
  const diffDays = (now - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays <= 7;
}

async function getActiveDeliveryRider(deliveryManId: string) {
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

  return rider;
}

function buildAssignment(rider: any, taskType: DeliveryTaskType, note?: string) {
  return {
    taskType,
    deliveryManId: rider._id,
    name: rider.name || "",
    phone: rider.phone || "",
    email: rider.email || "",
    vehicleType: rider.vehicleType || "",
    note: String(note || "").trim(),
    pickupPhoto: "",
    deliveryPhoto: "",
    assignedAt: new Date(),
    pickedUpAt: null,
    outForDeliveryAt: null,
    deliveredAt: null,
    failedAt: null,
    returnedAt: null,
    returnedToStoreAt: null,
    otpCode: "",
    otpChannel: "",
    otpSentTo: "",
    otpExpiresAt: null,
    otpLastSentAt: null,
    otpVerifiedAt: null,
    isOtpVerified: false,
    status: "Assigned",
  };
}

function normalizeImages(images: any) {
  if (!Array.isArray(images)) return [];
  return images
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function isExchangeResolution(order: any) {
  const rr = order?.returnRequest || {};

  const preferredResolution = String(
    rr.preferredResolution || ""
  ).toUpperCase();

  const requestType = String(rr.type || "").toUpperCase();

  const exchangeStatus = String(
    order?.exchange?.status || "NONE"
  ).toUpperCase();

  return (
    preferredResolution === "EXCHANGE" ||
    requestType === "EXCHANGE" ||
    (exchangeStatus !== "NONE" && exchangeStatus !== "")
  );
}

function toRequestRow(
  order: any,
  type: "CANCELLATION" | "RETURN" | "REFUND" | "EXCHANGE"
) {
  const customer = order.customer || {};
  const orderId = String(order._id || order.id || "");

  if (type === "CANCELLATION") {
    const req = order.cancelRequest || {};
    return {
      id: `${orderId}-cancel`,
      orderId,
      orderCode: order.orderCode || "",
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      type,
      status: req.status || "NONE",
      reason: req.reason || "",
      amountPaisa: Number(order.totalPaisa || 0),
      paymentMethod: order.paymentMethod || "COD",
      requestedAt: req.requestedAt || null,
      resolvedAt: req.resolvedAt || null,
      adminNote: req.adminNote || "",
      requestType: "",
      preferredResolution: "",
      refundStatus: order.refund?.status || "NONE",
      exchangeStatus: order.exchange?.status || "NONE",
      assignedRider:
        order.deliveryAssignment?.name ||
        order.returnPickupAssignment?.name ||
        order.exchangePickupAssignment?.name ||
        order.replacementDeliveryAssignment?.name ||
        "",
    };
  }

  if (type === "RETURN") {
    const req = order.returnRequest || {};
    return {
      id: `${orderId}-return`,
      orderId,
      orderCode: order.orderCode || "",
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      type,
      status: req.status || "NONE",
      reason: req.reason || "",
      amountPaisa: Number(order.totalPaisa || 0),
      paymentMethod: order.paymentMethod || "COD",
      requestedAt: req.requestedAt || null,
      resolvedAt: req.resolvedAt || req.receivedAt || null,
      adminNote: req.adminNote || "",
      requestType: req.type || "RETURN_REFUND",
      preferredResolution: req.preferredResolution || "REFUND",
      refundStatus: order.refund?.status || "NONE",
      exchangeStatus: order.exchange?.status || "NONE",
      assignedRider:
        order.returnPickupAssignment?.name ||
        order.exchangePickupAssignment?.name ||
        order.replacementDeliveryAssignment?.name ||
        "",
    };
  }

  if (type === "EXCHANGE") {
    const ex = order.exchange || {};
    return {
      id: `${orderId}-exchange`,
      orderId,
      orderCode: order.orderCode || "",
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      customerPhone: customer.phone || "",
      type,
      status: ex.status || "NONE",
      reason: ex.reason || order.returnRequest?.reason || "",
      amountPaisa: Number(order.totalPaisa || 0),
      paymentMethod: order.paymentMethod || "COD",
      requestedAt: ex.requestedAt || order.returnRequest?.requestedAt || null,
      resolvedAt: ex.completedAt || ex.replacementDeliveredAt || null,
      adminNote: ex.adminNote || "",
      requestType: order.returnRequest?.type || "EXCHANGE",
      preferredResolution: "EXCHANGE",
      refundStatus: order.refund?.status || "NONE",
      exchangeStatus: ex.status || "NONE",
      assignedRider:
        order.exchangePickupAssignment?.name ||
        order.replacementDeliveryAssignment?.name ||
        "",
    };
  }

  const refund = order.refund || {};
  return {
    id: `${orderId}-refund`,
    orderId,
    orderCode: order.orderCode || "",
    customerName: customer.name || "",
    customerEmail: customer.email || "",
    customerPhone: customer.phone || "",
    type,
    status: refund.status || "NONE",
    reason:
      order.returnRequest?.reason ||
      order.cancelRequest?.reason ||
      "Refund request",
    amountPaisa: Number(refund.amountPaisa || order.totalPaisa || 0),
    paymentMethod: refund.method || order.paymentMethod || "COD",
    requestedAt: refund.requestedAt || null,
    resolvedAt: refund.refundedAt || refund.processedAt || null,
    adminNote: refund.adminNote || "",
    requestType: order.returnRequest?.type || "",
    preferredResolution: order.returnRequest?.preferredResolution || "",
    refundStatus: refund.status || "NONE",
    exchangeStatus: order.exchange?.status || "NONE",
    assignedRider:
      order.returnPickupAssignment?.name ||
      order.exchangePickupAssignment?.name ||
      order.replacementDeliveryAssignment?.name ||
      "",
  };
}

export const orderService = {
  async createOrder(userId: string, body: CreateOrderBody) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    if (!body?.items?.length) {
      throw new Error("Cart is empty");
    }

    if (!body.paymentMethod) {
      throw new Error("paymentMethod is required");
    }

    if (body.paymentRef) {
      const existing = await Order.findOne({
        paymentRef: body.paymentRef,
      }).lean();

      if (existing) {
        return {
          id: String((existing as any)._id),
          orderCode: (existing as any).orderCode,
          totalPaisa: Number((existing as any).totalPaisa || 0),
          discountPaisa: Number((existing as any).discountPaisa || 0),
          coupon: (existing as any).coupon || null,
          paymentStatus: (existing as any).paymentStatus,
          orderStatus: (existing as any).orderStatus,
          shipping: {
            method: (existing as any).shipping?.method || "Standard Shipping",
            estimatedDelivery:
              (existing as any).shipping?.estimatedDelivery ||
              computeEstimatedDeliveryRange(),
          },
        };
      }
    }

    const normalizedItems = body.items.map((item) => ({
      productId: String(item.productId || "").trim(),
      variantId: String(item.variantId || "").trim(),
      size: normalizeSize(item.size),
      color: normalizeHexColor(item.color),
      colorLabel: String(item.colorLabel || "").trim(),
      sku: String(item.sku || "").trim(),
      qty: Math.max(1, Number(item.qty || 1)),
    }));

    const qtyByProductId = new Map<string, number>();

    for (const it of normalizedItems) {
      if (!mongoose.Types.ObjectId.isValid(it.productId)) {
        throw new Error("Invalid product id");
      }

      qtyByProductId.set(
        it.productId,
        (qtyByProductId.get(it.productId) || 0) + it.qty
      );
    }

    const productIds = Array.from(qtyByProductId.keys());

    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name price stock status image images categoryId variants")
      .lean();

    const productMap = new Map<string, any>(
      products.map((p: any) => [String(p._id), p])
    );

    const stockRequestMap = new Map<
      string,
      {
        productId: string;
        variantId?: string;
        qty: number;
        product: any;
        variant?: any;
        isVariantStock: boolean;
      }
    >();

    for (const item of normalizedItems) {
      const product: any = productMap.get(item.productId);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (String(product.status) !== "Active") {
        throw new Error(`Product is inactive: ${product.name}`);
      }

      const variants = Array.isArray(product.variants) ? product.variants : [];
      const matchedVariant = findMatchingVariant(product, item);

      if (variants.length > 0) {
        if (!matchedVariant) {
          throw new Error(
            `Variant not found for ${product.name} (${item.colorLabel || item.color}, ${item.size})`
          );
        }

        if (matchedVariant.isActive === false) {
          throw new Error(`Selected variant is inactive: ${product.name}`);
        }

        const available = Number(matchedVariant.stock || 0);

        if (available < item.qty) {
          throw new Error(
            `Out of stock: ${product.name} ${item.colorLabel || item.color} ${item.size} (Available: ${available}, Requested: ${item.qty})`
          );
        }

        const key = `variant:${getVariantId(matchedVariant)}`;
        const existing = stockRequestMap.get(key);

        stockRequestMap.set(key, {
          productId: item.productId,
          variantId: getVariantId(matchedVariant),
          qty: (existing?.qty || 0) + item.qty,
          product,
          variant: matchedVariant,
          isVariantStock: true,
        });

        continue;
      }

      const available = Number(product.stock || 0);

      if (available < item.qty) {
        throw new Error(
          `Out of stock: ${product.name} (Available: ${available}, Requested: ${item.qty})`
        );
      }

      const key = `product:${item.productId}`;
      const existing = stockRequestMap.get(key);

      stockRequestMap.set(key, {
        productId: item.productId,
        qty: (existing?.qty || 0) + item.qty,
        product,
        isVariantStock: false,
      });
    }

    for (const request of stockRequestMap.values()) {
      if (request.isVariantStock) {
        const available = Number(request.variant?.stock || 0);

        if (available < request.qty) {
          throw new Error(
            `Out of stock: ${request.product.name} (Available: ${available}, Requested: ${request.qty})`
          );
        }
      } else {
        const available = Number(request.product?.stock || 0);

        if (available < request.qty) {
          throw new Error(
            `Out of stock: ${request.product.name} (Available: ${available}, Requested: ${request.qty})`
          );
        }
      }
    }

    let subtotalPaisa = 0;

    const orderItems = normalizedItems.map((i) => {
      const p = productMap.get(String(i.productId));

      if (!p) {
        throw new Error(`Product not found: ${i.productId}`);
      }

      const matchedVariant = findMatchingVariant(p, i);

      const qty = Math.max(1, Number(i.qty || 1));
      const pricePaisa = Math.round(Number(p.price || 0) * 100);

      subtotalPaisa += pricePaisa * qty;

      const image = String(
        p.image || (Array.isArray(p.images) ? p.images[0] : "") || ""
      );

      return {
        productId: new mongoose.Types.ObjectId(i.productId),

        variantId:
          matchedVariant && getVariantId(matchedVariant)
            ? new mongoose.Types.ObjectId(getVariantId(matchedVariant))
            : null,

        name: p.name,
        size: i.size || String(matchedVariant?.size || "").trim(),
        color: i.color || String(matchedVariant?.color || "").trim(),
        colorLabel: i.colorLabel || "",
        sku: i.sku || String(matchedVariant?.sku || "").trim(),

        qty,
        pricePaisa,
        image,
      };
    });

    const shippingPaisa = subtotalPaisa > 0 ? 10000 : 0;

    let discountPaisa = 0;
    let couponSnapshot: any = null;
    let userCouponId: string | null = null;

    const couponCode = String(body.couponCode || "").trim();

    if (couponCode) {
      const out = await discountService.computeDiscountPaisa({
        userId,
        couponCode,
        items: normalizedItems.map((x) => ({
          productId: x.productId,
          variantId: x.variantId || null,
          qty: x.qty,
        })),
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

    const bulkOps = Array.from(stockRequestMap.values()).map((request) => {
      if (request.isVariantStock && request.variantId) {
        return {
          updateOne: {
            filter: {
              _id: new mongoose.Types.ObjectId(request.productId),
              "variants._id": new mongoose.Types.ObjectId(request.variantId),
              "variants.stock": { $gte: request.qty },
              "variants.isActive": { $ne: false },
              stock: { $gte: request.qty },
            },
            update: {
              $inc: {
                stock: -request.qty,
                "variants.$.stock": -request.qty,
              },
            },
          },
        };
      }

      return {
        updateOne: {
          filter: {
            _id: new mongoose.Types.ObjectId(request.productId),
            stock: { $gte: request.qty },
          },
          update: { $inc: { stock: -request.qty } },
        },
      };
    });

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

    const totalPaisa = Math.max(
      0,
      subtotalPaisa + shippingPaisa - discountPaisa
    );

    const orderCode = await generateUniqueOrderCode();

    let orderAddress: any = null;

    if (body.addressId && mongoose.Types.ObjectId.isValid(body.addressId)) {
      const saved = await Address.findOne({
        _id: body.addressId,
        userId: new mongoose.Types.ObjectId(userId),
      }).lean();

      if (!saved) {
        throw new Error("Address not found");
      }

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
        label: body.address.label || "Home",
        email: body.address.email || "",
        firstName: "",
        lastName: "",
        fullName: body.address.fullName || "",
        phone: body.address.phone || "",
        country: "Nepal",
        provinceId: body.address.provinceId || "",
        district: body.address.district || body.address.area || "",
        cityOrMunicipality: body.address.city || "",
        addressLine:
          body.address.addressLine ||
          body.address.area ||
          body.address.street ||
          "",
        street: body.address.street || "",
        postalCode: body.address.postalCode || "",
        isDefault: false,
        lat: normalizeNumber(body.address.lat),
        lng: normalizeNumber(body.address.lng),
      };
    }

    if (!orderAddress) {
      throw new Error("Delivery address is required");
    }

    if (!String(orderAddress.fullName || "").trim()) {
      throw new Error("Customer name is required");
    }

    const phoneDigits = String(orderAddress.phone || "").replace(/\D/g, "");

    if (!phoneDigits) {
      throw new Error("Phone number is required");
    }

    if (!/^9[6-8]\d{8}$/.test(phoneDigits)) {
      throw new Error("Enter a valid Nepali phone number");
    }

    if (!String(orderAddress.cityOrMunicipality || "").trim()) {
      throw new Error("City/Municipality is required");
    }

    if (!String(orderAddress.district || "").trim()) {
      throw new Error("District is required");
    }

    if (!String(orderAddress.addressLine || orderAddress.street || "").trim()) {
      throw new Error("Address is required");
    }

    orderAddress.phone = phoneDigits;

    const estimatedDelivery = computeEstimatedDeliveryRange();

    const requestedPaymentStatus = String(body.paymentStatus || "").trim();

    const initialPaymentStatus: "Paid" | "Pending" | "Failed" =
      body.paymentMethod === "COD"
        ? "Pending"
        : body.paymentRef && requestedPaymentStatus === "Paid"
          ? "Paid"
          : requestedPaymentStatus === "Failed"
            ? "Failed"
            : "Pending";

    const now = new Date();

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
      orderStatus: "Confirmed",
      paymentRef: body.paymentRef || null,
      address: orderAddress,
      shipping: {
        method: "Standard Shipping",
        estimatedDelivery,
      },

      deliveryAssignment: null,
      returnPickupAssignment: null,
      exchangePickupAssignment: null,
      replacementDeliveryAssignment: null,

      cancelRequest: {
        status: "NONE",
        reason: "",
        requestedAt: null,
        resolvedAt: null,
        adminNote: "",
        resolvedBy: null,
      },

      returnRequest: {
        status: "NONE",
        type: "RETURN_REFUND",
        preferredResolution: "REFUND",
        reason: "",
        images: [],
        requestedAt: null,
        approvedAt: null,
        rejectedAt: null,
        resolvedAt: null,
        pickedUpAt: null,
        receivedAt: null,
        adminNote: "",
        resolvedBy: null,
      },

      refund: {
        status: "NONE",
        amountPaisa: 0,
        method: "",
        accountName: "",
        accountNumber: "",
        bankName: "",
        walletNumber: "",
        walletId: "",
        requestedAt: null,
        requestedDetailsAt: null,
        detailsSubmittedAt: null,
        processedAt: null,
        refundedAt: null,
        failedAt: null,
        adminNote: "",
        customerNote: "",
        processedBy: null,
        transactionRef: "",
      },

      exchange: {
        status: "NONE",
        reason: "",
        images: [],
        replacementItems: [],
        pickupDeliveryManId: null,
        replacementDeliveryManId: null,
        requestedAt: null,
        approvedAt: null,
        rejectedAt: null,
        pickupAssignedAt: null,
        pickedUpAt: null,
        receivedAt: null,
        replacementAssignedAt: null,
        replacementDeliveredAt: null,
        completedAt: null,
        adminNote: "",
        resolvedBy: null,
      },

      confirmedAt: now,
      processingAt: null,
      shippedAt: null,
      inTransitAt: null,
      deliveredAt: null,
      cancelledAt: null,
      returnedAt: null,
      refundedAt: null,

      invoiceNo: null,
      invoiceSentAt: null,
    };

    const doc: any = await Order.create(payload);

    try {
      await notificationService.createAdminForAll({
        title: "New order confirmed",
        message: `A new order ${orderCode} has been placed and confirmed.`,
        type: "order",
        link: `/admin/orders/${String(doc._id)}`,
        meta: {
          orderId: String(doc._id),
          orderCode,
          customerId: userId,
          totalPaisa,
          orderStatus: doc.orderStatus,
        },
      });
    } catch (e: any) {
      console.log("Admin notification create failed (ignored):", e?.message);
    }

    try {
      const io = getIO();

      io.to("admins").emit(
        "order:updated",
        buildOrderCreatedPayload(doc, userId)
      );
    } catch (e: any) {
      console.log("New order socket emit failed (ignored):", e?.message);
    }

    try {
      await notificationService.createCustomer({
        userId,
        title: "Order confirmed",
        message: `Your order ${orderCode} has been placed and confirmed successfully.`,
        type: "order",
        link: orderDetailsLink(orderCode),
        meta: {
          orderId: String(doc._id),
          orderCode,
          orderStatus: doc.orderStatus,
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
      paymentStatus: doc.paymentStatus,
      orderStatus: doc.orderStatus,
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

    return (orders as any[]).map((o: any) => this.mapOrder(o));
  },

  async getMyOrdersSummary(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const orders = await Order.find({
      customer: new mongoose.Types.ObjectId(userId),
    })
      .select(
        "orderCode createdAt orderStatus totalPaisa items cancelRequest returnRequest refund exchange"
      )
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
        orderStatus: String(o.orderStatus || "Confirmed"),
        totalPaisa: Number(o.totalPaisa || 0),
        total: Math.round(Number(o.totalPaisa || 0) / 100),
        itemsCount: items.length,
        items: previewImage ? [{ image: previewImage }] : [],
        cancelRequest: o.cancelRequest || { status: "NONE" },
        returnRequest: o.returnRequest || { status: "NONE" },
        refund: o.refund || { status: "NONE" },
        exchange: o.exchange || { status: "NONE" },
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

    const normalizedCode = value.startsWith("#") ? value : `#${value}`;

    const byCode = await Order.findOne({ orderCode: normalizedCode })
      .populate("customer", "name email phone")
      .lean();

    if (!byCode) return null;

    return this.mapOrder(byCode);
  },

  async updateOrder(idOrCode: string, input: UpdateInput) {
    const raw = String(idOrCode || "").trim();
    if (!raw) return null;

    const isObjId = mongoose.Types.ObjectId.isValid(raw);
    const normalizedCode = raw.startsWith("#") ? raw : `#${raw}`;

    const found: any = isObjId
      ? await Order.findById(raw).lean()
      : await Order.findOne({ orderCode: normalizedCode }).lean();

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

    if (nextStatus === "Delivered") {
      const otpVerified = Boolean(found?.deliveryAssignment?.isOtpVerified);

      if (!otpVerified) {
        throw new Error(
          "Delivered status requires OTP verification. Use delivery OTP verification instead."
        );
      }
    }

    const now = new Date();

    if (nextStatus === "Confirmed" && !found.confirmedAt) {
      update.confirmedAt = now;
    }

    if (nextStatus === "Processing" && !found.processingAt) {
      update.processingAt = now;
      if (!found.confirmedAt) update.confirmedAt = now;
    }

    if (nextStatus === "Shipped" && !found.shippedAt) {
      update.shippedAt = now;
      if (!found.processingAt) update.processingAt = now;
      if (!found.confirmedAt) update.confirmedAt = now;
    }

    if (nextStatus === "Transit" && !found.inTransitAt) {
      update.inTransitAt = now;
      if (!found.shippedAt) update.shippedAt = now;
      if (!found.processingAt) update.processingAt = now;
      if (!found.confirmedAt) update.confirmedAt = now;
    }

    if (nextStatus === "Delivered" && !found.deliveredAt) {
      update.deliveredAt = now;
      if (!found.shippedAt) update.shippedAt = now;
      if (!found.inTransitAt) update.inTransitAt = now;
      if (!found.processingAt) update.processingAt = now;
      if (!found.confirmedAt) update.confirmedAt = now;
    }

    if (nextStatus === "Cancelled" && !found.cancelledAt) {
      update.cancelledAt = now;
    }

    if (nextStatus === "Returned" && !found.returnedAt) {
      update.returnedAt = now;
    }

    if (nextStatus === "Refunded" && !found.refundedAt) {
      update.refundedAt = now;
    }

    if (input.deliveryAssignment) {
      const nextDeliveryAssignment = { ...(found.deliveryAssignment || {}) };

      if (input.deliveryAssignment.deliveryManId) {
        const rider = await getActiveDeliveryRider(
          String(input.deliveryAssignment.deliveryManId)
        );

        nextDeliveryAssignment.taskType = "NORMAL_DELIVERY";
        nextDeliveryAssignment.deliveryManId = rider._id;
        nextDeliveryAssignment.name = rider.name || "";
        nextDeliveryAssignment.phone = rider.phone || "";
        nextDeliveryAssignment.email = rider.email || "";
        nextDeliveryAssignment.vehicleType = rider.vehicleType || "";

        if (!nextDeliveryAssignment.assignedAt) {
          nextDeliveryAssignment.assignedAt = now;
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

        if (nextDeliveryAssignment.returnedToStoreAt === undefined) {
          nextDeliveryAssignment.returnedToStoreAt = null;
        }
      }

      if (typeof input.deliveryAssignment.note === "string") {
        nextDeliveryAssignment.note = input.deliveryAssignment.note.trim();
      }

      if (input.deliveryAssignment.status) {
        if (input.deliveryAssignment.status === "Delivered") {
          const otpVerified = Boolean(found?.deliveryAssignment?.isOtpVerified);

          if (!otpVerified) {
            throw new Error(
              "Delivered status requires OTP verification. Use delivery OTP verification instead."
            );
          }
        }

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

          nextDeliveryAssignment.isOtpVerified = false;
          nextDeliveryAssignment.otpVerifiedAt = null;

          if (!found.inTransitAt) update.inTransitAt = now;
          if (!found.shippedAt) update.shippedAt = now;
          if (!found.processingAt) update.processingAt = now;
          if (!found.confirmedAt) update.confirmedAt = now;
          if (!update.orderStatus) update.orderStatus = "Transit";
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

          if (!found.deliveredAt) update.deliveredAt = now;
          if (!found.inTransitAt) update.inTransitAt = now;
          if (!found.shippedAt) update.shippedAt = now;
          if (!found.processingAt) update.processingAt = now;
          if (!found.confirmedAt) update.confirmedAt = now;
          if (!update.orderStatus) update.orderStatus = "Delivered";
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

        if (
          input.deliveryAssignment.status === "Returned to Store" &&
          !nextDeliveryAssignment.returnedToStoreAt
        ) {
          nextDeliveryAssignment.returnedToStoreAt = now;
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

    await emitOrderUpdated(updated, String(found.customer || ""));

    const updatedOrderId = String(updated._id || found._id);
    const customerId = String(
      (updated as any)?.customer?._id || found.customer || ""
    );
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
          title: prevDeliveryManId
            ? "Order Reassigned"
            : "New Delivery Assigned",
          message: prevDeliveryManId
            ? `Order ${orderCode} has been reassigned to you.`
            : `Order ${orderCode} has been assigned to you for delivery.`,
          type: "order",
          link: deliveryOrderLink(updatedOrderId),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            deliveryStatus: nextDeliveryStatus || "Assigned",
            action: prevDeliveryManId
              ? "delivery_reassigned"
              : "delivery_assigned",
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
      console.log(
        "Delivery assignment notification failed (ignored):",
        e?.message
      );
    }

    try {
      if (
        nextDeliveryStatus &&
        nextDeliveryStatus !== prevDeliveryStatus &&
        customerId
      ) {
        const titleMap: Record<string, string> = {
          "Picked Up": "Order Picked Up",
          "Out for Delivery": "Out for Delivery",
          Delivered: "Order Delivered",
          "Failed Delivery": "Delivery Failed",
          Returned: "Order Returned",
          "Returned to Store": "Returned to Store",
        };

        const messageMap: Record<string, string> = {
          "Picked Up": `Your order ${orderCode} has been picked up by the delivery rider.`,
          "Out for Delivery": `Your order ${orderCode} is out for delivery.`,
          Delivered: `Your order ${orderCode} has been delivered. Thank you for shopping with us!`,
          "Failed Delivery": `Delivery attempt failed for order ${orderCode}.`,
          Returned: `Your order ${orderCode} has been returned.`,
          "Returned to Store": `Your order ${orderCode} has been returned to store.`,
        };

        if (titleMap[nextDeliveryStatus]) {
          await notificationService.createCustomer({
            userId: customerId,
            title: titleMap[nextDeliveryStatus],
            message: messageMap[nextDeliveryStatus],
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: updatedOrderId,
              orderCode,
              deliveryStatus: nextDeliveryStatus,
              action: `delivery_${nextDeliveryStatus.toLowerCase().replace(/\s+/g, "_")}`,
            },
          });
        }
      }
    } catch (e: any) {
      console.log(
        "Customer delivery status notification failed (ignored):",
        e?.message
      );
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

  async requestCancellation(input: RequestCancellationInput) {
    const userId = String(input.userId || "");
    const reason = String(input.reason || "").trim();

    if (!reason) {
      throw new Error("Cancellation reason is required");
    }

    if (reason.length < 3) {
      throw new Error("Cancellation reason must be at least 3 characters");
    }

    const found: any = await findCustomerOrderRaw(userId, input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    const orderStatus = String(found.orderStatus || "");
    const blockedStatuses = [
      "Shipped",
      "Transit",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded",
    ];

    if (blockedStatuses.includes(orderStatus)) {
      throw new Error("This order can no longer be cancelled");
    }

    if (found.cancelRequest?.status === "REQUESTED") {
      throw new Error("Cancellation request already submitted");
    }

    if (found.cancelRequest?.status === "APPROVED") {
      throw new Error("Cancellation request already approved");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          cancelRequest: {
            status: "REQUESTED",
            reason,
            requestedAt: now,
            resolvedAt: null,
            adminNote: "",
            resolvedBy: null,
          },
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyAdmin({
      title: "Cancellation Request Received",
      message: `Customer requested cancellation for order ${orderCode}.`,
      link: adminReturnsRefundsLink(),
      meta: {
        orderId,
        orderCode,
        customerId: userId,
        action: "cancel_request_received",
      },
    });

    await notifyCustomer({
      userId,
      title: "Cancellation Request Submitted",
      message: `Your cancellation request for order ${orderCode} has been submitted and is waiting for admin review.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_submitted",
      },
    });

    await emitOrderUpdated(updated, userId);

    return this.mapOrder(updated);
  },

  async requestReturn(input: RequestReturnInput) {
    const userId = String(input.userId || "");
    const reason = String(input.reason || "").trim();

    if (!reason) {
      throw new Error("Return/exchange reason is required");
    }

    if (reason.length < 3) {
      throw new Error("Return/exchange reason must be at least 3 characters");
    }

    const requestType = String(input.type || "RETURN_REFUND").toUpperCase();
    const allowedTypes = [
      "RETURN_REFUND",
      "EXCHANGE",
      "DAMAGED",
      "WRONG_ITEM",
      "SIZE_COLOR_ISSUE",
      "NOT_SATISFIED",
      "OTHER",
    ];

    if (!allowedTypes.includes(requestType)) {
      throw new Error("Invalid request type");
    }

    const preferredResolution = String(
      input.preferredResolution ||
        (requestType === "EXCHANGE" ? "EXCHANGE" : "REFUND")
    ).toUpperCase();

    if (!["REFUND", "EXCHANGE"].includes(preferredResolution)) {
      throw new Error("Invalid preferred resolution");
    }

    const found: any = await findCustomerOrderRaw(userId, input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (String(found.orderStatus || "") !== "Delivered") {
      throw new Error("Return/exchange request is available only after delivery");
    }

    if (!isReturnWindowAllowed(found)) {
      throw new Error("Return/exchange request period has expired");
    }

    const existingReturnStatus = String(found.returnRequest?.status || "NONE");
    const existingExchangeStatus = String(found.exchange?.status || "NONE");

    if (
      !["NONE", "REJECTED"].includes(existingReturnStatus) ||
      !["NONE", "REJECTED"].includes(existingExchangeStatus)
    ) {
      throw new Error("Return/exchange request already submitted");
    }

    const now = new Date();
    const images = normalizeImages(input.images);

    const setPayload: any = {
      returnRequest: {
        status: "REQUESTED",
        type: requestType,
        preferredResolution,
        reason,
        images,
        requestedAt: now,
        approvedAt: null,
        rejectedAt: null,
        resolvedAt: null,
        pickedUpAt: null,
        receivedAt: null,
        adminNote: "",
        resolvedBy: null,
      },
    };

    if (preferredResolution === "EXCHANGE") {
      setPayload.exchange = {
        status: "REQUESTED",
        reason,
        images,
        replacementItems: [],
        pickupDeliveryManId: null,
        replacementDeliveryManId: null,
        requestedAt: now,
        approvedAt: null,
        rejectedAt: null,
        pickupAssignedAt: null,
        pickedUpAt: null,
        receivedAt: null,
        replacementAssignedAt: null,
        replacementDeliveredAt: null,
        completedAt: null,
        adminNote: "",
        resolvedBy: null,
      };
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: setPayload },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const label =
      preferredResolution === "EXCHANGE" ? "exchange" : "return/refund";

    await notifyAdmin({
      title:
        preferredResolution === "EXCHANGE"
          ? "Exchange Request Received"
          : "Return / Refund Request Received",
      message: `Customer requested ${label} for order ${orderCode}.`,
      link: adminReturnsRefundsLink(),
      meta: {
        orderId,
        orderCode,
        customerId: userId,
        action:
          preferredResolution === "EXCHANGE"
            ? "exchange_request_received"
            : "return_request_received",
        requestType,
        preferredResolution,
      },
    });

    await notifyCustomer({
      userId,
      title:
        preferredResolution === "EXCHANGE"
          ? "Exchange Request Submitted"
          : "Return / Refund Request Submitted",
      message: `Your ${label} request for order ${orderCode} has been submitted and is waiting for admin review.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action:
          preferredResolution === "EXCHANGE"
            ? "exchange_request_submitted"
            : "return_request_submitted",
        requestType,
        preferredResolution,
      },
    });

    await emitOrderUpdated(updated, userId);

    return this.mapOrder(updated);
  },

  async approveCancellation(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.cancelRequest?.status !== "REQUESTED") {
      throw new Error("No pending cancellation request found");
    }

    if (
      ["Shipped", "Transit", "Delivered", "Returned", "Refunded"].includes(
        String(found.orderStatus || "")
      )
    ) {
      throw new Error("This order can no longer be cancelled");
    }

    const now = new Date();
    const refund = buildRefundAfterCancellation(found);

    await restockOrderItems(found);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          orderStatus: "Cancelled",
          cancelledAt: now,
          cancelRequest: {
            status: "APPROVED",
            reason: found.cancelRequest?.reason || "",
            requestedAt: found.cancelRequest?.requestedAt || null,
            resolvedAt: now,
            adminNote,
            resolvedBy: mongoose.Types.ObjectId.isValid(adminId)
              ? new mongoose.Types.ObjectId(adminId)
              : null,
          },
          refund,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Cancellation Approved",
      message:
        updated.refund?.status === "PENDING"
          ? `Your cancellation request for order ${orderCode} was approved. Refund is now pending.`
          : `Your cancellation request for order ${orderCode} was approved.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_approved",
        refundStatus: updated.refund?.status || "NONE",
      },
    });

    await notifyAdmin({
      title: "Cancellation Approved",
      message: `Cancellation request for order ${orderCode} has been approved.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_approved",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async rejectCancellation(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.cancelRequest?.status !== "REQUESTED") {
      throw new Error("No pending cancellation request found");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          cancelRequest: {
            status: "REJECTED",
            reason: found.cancelRequest?.reason || "",
            requestedAt: found.cancelRequest?.requestedAt || null,
            resolvedAt: now,
            adminNote,
            resolvedBy: mongoose.Types.ObjectId.isValid(adminId)
              ? new mongoose.Types.ObjectId(adminId)
              : null,
          },
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Cancellation Rejected",
      message: `Your cancellation request for order ${orderCode} was rejected.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_rejected",
        adminNote,
      },
    });

    await notifyAdmin({
      title: "Cancellation Rejected",
      message: `Cancellation request for order ${orderCode} has been rejected.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "cancel_request_rejected",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async approveReturn(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "REQUESTED") {
      throw new Error("No pending return/exchange request found");
    }

    const now = new Date();
    const exchangeFlow =
      String(found.returnRequest?.preferredResolution || "").toUpperCase() ===
      "EXCHANGE";

    const update: any = {
      "returnRequest.status": "APPROVED",
      "returnRequest.approvedAt": now,
      "returnRequest.resolvedAt": now,
      "returnRequest.adminNote": adminNote,
      "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
    };

    if (exchangeFlow) {
      update["exchange.status"] = "APPROVED";
      update["exchange.approvedAt"] = now;
      update["exchange.adminNote"] = adminNote;
      update["exchange.resolvedBy"] = mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null;
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: exchangeFlow ? "Exchange Approved" : "Return Approved",
      message: exchangeFlow
        ? `Your exchange request for order ${orderCode} was approved. A pickup rider will be assigned soon.`
        : `Your return request for order ${orderCode} was approved. A pickup rider will be assigned soon.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_approved"
          : "return_request_approved",
      },
    });

    await notifyAdmin({
      title: exchangeFlow ? "Exchange Approved" : "Return Approved",
      message: exchangeFlow
        ? `Exchange request for order ${orderCode} has been approved.`
        : `Return request for order ${orderCode} has been approved.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_approved"
          : "return_request_approved",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async rejectReturn(input: AdminRequestActionInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "REQUESTED") {
      throw new Error("No pending return/exchange request found");
    }

    const now = new Date();
    const exchangeFlow =
      String(found.returnRequest?.preferredResolution || "").toUpperCase() ===
      "EXCHANGE";

    const update: any = {
      "returnRequest.status": "REJECTED",
      "returnRequest.rejectedAt": now,
      "returnRequest.resolvedAt": now,
      "returnRequest.adminNote": adminNote,
      "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
    };

    if (exchangeFlow) {
      update["exchange.status"] = "REJECTED";
      update["exchange.rejectedAt"] = now;
      update["exchange.adminNote"] = adminNote;
      update["exchange.resolvedBy"] = mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null;
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: exchangeFlow ? "Exchange Rejected" : "Return Rejected",
      message: exchangeFlow
        ? `Your exchange request for order ${orderCode} was rejected.`
        : `Your return request for order ${orderCode} was rejected.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_rejected"
          : "return_request_rejected",
        adminNote,
      },
    });

    await notifyAdmin({
      title: exchangeFlow ? "Exchange Rejected" : "Return Rejected",
      message: exchangeFlow
        ? `Exchange request for order ${orderCode} has been rejected.`
        : `Return request for order ${orderCode} has been rejected.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: exchangeFlow
          ? "exchange_request_rejected"
          : "return_request_rejected",
        adminId,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async assignReturnPickup(input: AssignPickupInput) {
    const adminId = String(input.adminId || "");
    const deliveryManId = String(input.deliveryManId || "");
    const note = String(input.note || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "APPROVED") {
      throw new Error("Return request must be approved before assigning pickup");
    }

    if (isExchangeResolution(found)) {
      throw new Error("This is an exchange request. Use exchange pickup assignment.");
    }

    const rider = await getActiveDeliveryRider(deliveryManId);
    const now = new Date();
    const assignment = buildAssignment(rider, "RETURN_PICKUP", note);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          returnPickupAssignment: assignment,
          "returnRequest.status": "PICKUP_ASSIGNED",
          "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const customerId = String(updated.customer?._id || updated.customer || "");

    await notifyDelivery({
      userId: String(rider._id),
      title: "Return Pickup Assigned",
      message: `Return pickup for order ${orderCode} has been assigned to you.`,
      link: deliveryOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        taskType: "RETURN_PICKUP",
        action: "return_pickup_assigned",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Return Pickup Assigned",
      message: `A delivery rider has been assigned to collect your return product for order ${orderCode}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        taskType: "RETURN_PICKUP",
        action: "return_pickup_assigned",
      },
    });

    await notifyAdmin({
      title: "Return Pickup Assigned",
      message: `Return pickup rider has been assigned for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        deliveryManId,
        assignedAt: now,
        action: "return_pickup_assigned",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async assignExchangePickup(input: AssignPickupInput) {
  const adminId = String(input.adminId || "");
  const deliveryManId = String(input.deliveryManId || "");
  const note = String(input.note || "").trim();

  const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
  if (!found) {
    throw new Error("Order not found");
  }

  const returnStatus = String(
    found?.returnRequest?.status || "NONE"
  ).toUpperCase();

  const exchangeStatus = String(
    found?.exchange?.status || "NONE"
  ).toUpperCase();

  const preferredResolution = String(
    found?.returnRequest?.preferredResolution || ""
  ).toUpperCase();

  const requestType = String(
    found?.returnRequest?.type || ""
  ).toUpperCase();

  const exchangeFlow =
    preferredResolution === "EXCHANGE" ||
    requestType === "EXCHANGE" ||
    exchangeStatus !== "NONE";

  if (!exchangeFlow) {
    throw new Error("This is not an exchange request");
  }

  if (exchangeStatus !== "APPROVED" && returnStatus !== "APPROVED") {
    throw new Error(
      "Exchange request must be approved before assigning pickup"
    );
  }

  const rider = await getActiveDeliveryRider(deliveryManId);
  const now = new Date();
  const assignment = buildAssignment(rider, "EXCHANGE_PICKUP", note);

  const updated: any = await Order.findByIdAndUpdate(
    found._id,
    {
      $set: {
  exchangePickupAssignment: assignment,

  "returnRequest.status": "PICKUP_ASSIGNED",
  "returnRequest.adminNote":
    note || found.returnRequest?.adminNote || "",

  "exchange.status": "PICKUP_ASSIGNED",
  "exchange.reason": found.exchange?.reason || found.returnRequest?.reason || "",
  "exchange.requestedAt":
    found.exchange?.requestedAt || found.returnRequest?.requestedAt || now,
  "exchange.approvedAt":
    found.exchange?.approvedAt || found.returnRequest?.approvedAt || now,
  "exchange.pickupDeliveryManId": rider._id,
  "exchange.pickupAssignedAt": now,
  "exchange.adminNote": note || found.exchange?.adminNote || "",
  "exchange.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
    ? new mongoose.Types.ObjectId(adminId)
    : null,
},
    },
    { new: true }
  )
    .populate("customer", "name email phone")
    .lean();

  if (!updated) {
    throw new Error("Order not found");
  }

  const orderId = String(updated._id);
  const orderCode = String(updated.orderCode || "");
  const customerId = String(updated.customer?._id || updated.customer || "");

  await notifyDelivery({
    userId: String(rider._id),
    title: "Exchange Pickup Assigned",
    message: `Exchange pickup for order ${orderCode} has been assigned to you.`,
    link: deliveryOrderLink(orderId),
    meta: {
      orderId,
      orderCode,
      taskType: "EXCHANGE_PICKUP",
      action: "exchange_pickup_assigned",
    },
  });

  await notifyCustomer({
    userId: customerId,
    title: "Exchange Pickup Assigned",
    message: `A delivery rider has been assigned to collect your exchange product for order ${orderCode}.`,
    link: orderDetailsLink(orderCode),
    meta: {
      orderId,
      orderCode,
      taskType: "EXCHANGE_PICKUP",
      action: "exchange_pickup_assigned",
    },
  });

  await notifyAdmin({
    title: "Exchange Pickup Assigned",
    message: `Exchange pickup rider has been assigned for order ${orderCode}.`,
    link: adminOrderLink(orderId),
    meta: {
      orderId,
      orderCode,
      adminId,
      deliveryManId,
      assignedAt: now,
      action: "exchange_pickup_assigned",
    },
  });

  await emitOrderUpdated(updated, customerId);

  return this.mapOrder(updated);
},

  async updateReturnOrExchangePickupByDelivery(input: MarkPickupStatusInput) {
    const deliveryManId = String(input.deliveryManId || "");
    const status = input.status;
    const note = String(input.note || "").trim();
    const photo = String(input.photo || "").trim();

    if (!mongoose.Types.ObjectId.isValid(deliveryManId)) {
      throw new Error("Invalid delivery user");
    }

    if (!["Picked Up", "Returned to Store", "Failed Delivery"].includes(status)) {
      throw new Error("Invalid return/exchange pickup status");
    }

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    const taskType =
      input.taskType ||
      (found.exchangePickupAssignment?.deliveryManId &&
      String(found.exchangePickupAssignment.deliveryManId) === deliveryManId
        ? "EXCHANGE_PICKUP"
        : "RETURN_PICKUP");

    const assignmentKey =
      taskType === "EXCHANGE_PICKUP"
        ? "exchangePickupAssignment"
        : "returnPickupAssignment";

    const assignment = found[assignmentKey];

    if (!assignment?.deliveryManId) {
      throw new Error("Pickup task is not assigned");
    }

    if (String(assignment.deliveryManId) !== deliveryManId) {
      throw new Error("This pickup task is not assigned to you");
    }

    const now = new Date();
    const nextAssignment = { ...assignment, status };

    if (note) nextAssignment.note = note;
    if (photo) nextAssignment.pickupPhoto = photo;

    if (status === "Picked Up" && !nextAssignment.pickedUpAt) {
      nextAssignment.pickedUpAt = now;
    }

    if (status === "Returned to Store" && !nextAssignment.returnedToStoreAt) {
      nextAssignment.returnedToStoreAt = now;
      if (!nextAssignment.pickedUpAt) nextAssignment.pickedUpAt = now;
    }

    if (status === "Failed Delivery" && !nextAssignment.failedAt) {
      nextAssignment.failedAt = now;
    }

    const update: any = {
      [assignmentKey]: nextAssignment,
    };

    if (taskType === "EXCHANGE_PICKUP") {
      if (status === "Picked Up") {
        update["returnRequest.status"] = "PICKED_UP";
        update["returnRequest.pickedUpAt"] = now;
        update["exchange.status"] = "PICKED_UP";
        update["exchange.pickedUpAt"] = now;
      }

      if (status === "Returned to Store") {
        update["returnRequest.status"] = "RECEIVED";
        update["returnRequest.receivedAt"] = now;
        update["exchange.status"] = "RECEIVED";
        update["exchange.receivedAt"] = now;
      }
    } else {
      if (status === "Picked Up") {
        update["returnRequest.status"] = "PICKED_UP";
        update["returnRequest.pickedUpAt"] = now;
      }

      if (status === "Returned to Store") {
        update["returnRequest.status"] = "RECEIVED";
        update["returnRequest.receivedAt"] = now;
      }
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const readableTask =
      taskType === "EXCHANGE_PICKUP" ? "exchange pickup" : "return pickup";

    await notifyAdmin({
      title: "Pickup Status Updated",
      message: `Rider updated ${readableTask} for order ${orderCode} to ${status}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        deliveryManId,
        taskType,
        status,
        action: "pickup_status_updated",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Pickup Status Updated",
      message: `Your ${readableTask} for order ${orderCode} is now ${status}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        taskType,
        status,
        action: "pickup_status_updated",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async markProductReceived(input: MarkProductReceivedInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!["PICKED_UP", "RECEIVED"].includes(String(found.returnRequest?.status || ""))) {
      throw new Error("Product must be picked up before marking received");
    }

    const now = new Date();
    const exchangeFlow = isExchangeResolution(found);
    const update: any = {
      "returnRequest.status": "RECEIVED",
      "returnRequest.receivedAt": now,
      "returnRequest.adminNote": adminNote,
      "returnRequest.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
      returnedAt: now,
    };

    if (exchangeFlow) {
      update["exchange.status"] = "RECEIVED";
      update["exchange.receivedAt"] = now;
      update["exchange.adminNote"] = adminNote;
      update["exchange.resolvedBy"] = mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null;
    } else {
      update.orderStatus = "Returned";
      update.refund = buildRefundAfterProductReceived(found);
    }

    await restockOrderItems(found);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Returned Product Received",
      message: exchangeFlow
        ? `Your returned product for exchange order ${orderCode} has been received. Replacement delivery will be arranged soon.`
        : `Your returned product for order ${orderCode} has been received. Refund process will continue now.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "returned_product_received",
        exchangeFlow,
        refundStatus: updated.refund?.status || "NONE",
      },
    });

    await notifyAdmin({
      title: "Returned Product Received",
      message: `Returned product for order ${orderCode} has been marked as received.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "returned_product_received",
        adminId,
        exchangeFlow,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async requestRefundDetails(input: RequestRefundDetailsInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.returnRequest?.status !== "RECEIVED") {
      throw new Error("Returned product must be received before requesting refund details");
    }

    if (!found.refund || found.refund.status === "NONE") {
      throw new Error("No refund is available for this order");
    }

    if (found.refund.status === "REFUNDED") {
      throw new Error("Refund already completed");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "refund.status": "PENDING_ACCOUNT_DETAILS",
          "refund.requestedDetailsAt": now,
          "refund.adminNote": adminNote,
          "refund.processedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Submit Refund Details",
      message: `Please submit your refund account details for order ${orderCode}.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "refund_details_requested",
      },
    });

    await notifyAdmin({
      title: "Refund Details Requested",
      message: `Refund account details requested from customer for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        action: "refund_details_requested",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async submitRefundDetails(input: SubmitRefundDetailsInput) {
    const userId = String(input.userId || "");
    const method = String(input.method || "").trim();

    if (!method) {
      throw new Error("Refund method is required");
    }

    const normalizedMethod =
      method === "Bank"
        ? "BANK"
        : method === "Khalti"
          ? "KHALTI"
          : method === "eSewa"
            ? "ESEWA"
            : method === "Fonepay"
              ? "FONEPAY"
              : method.toUpperCase();

    if (!["BANK", "KHALTI", "ESEWA", "FONEPAY"].includes(normalizedMethod)) {
      throw new Error("Invalid refund method");
    }

    const found: any = await findCustomerOrderRaw(userId, input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.refund?.status !== "PENDING_ACCOUNT_DETAILS") {
      throw new Error("Refund details are not requested for this order");
    }

    const accountName = String(input.accountName || "").trim();
    const accountNumber = String(input.accountNumber || "").trim();
    const bankName = String(input.bankName || "").trim();
    const walletNumber = String(input.walletNumber || "").trim();
    const walletId = String(input.walletId || "").trim();
    const customerNote = String(input.customerNote || "").trim();

    if (normalizedMethod === "BANK") {
      if (!accountName || !accountNumber || !bankName) {
        throw new Error("Bank name, account holder name, and account number are required");
      }
    } else {
      if (!walletNumber && !walletId) {
        throw new Error("Wallet number or wallet ID is required");
      }
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "refund.status": "READY_TO_REFUND",
          "refund.method": normalizedMethod,
          "refund.accountName": accountName,
          "refund.accountNumber": accountNumber,
          "refund.bankName": bankName,
          "refund.walletNumber": walletNumber,
          "refund.walletId": walletId,
          "refund.customerNote": customerNote,
          "refund.detailsSubmittedAt": now,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyAdmin({
      title: "Refund Details Submitted",
      message: `Customer submitted refund details for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        customerId: userId,
        method: normalizedMethod,
        action: "refund_details_submitted",
      },
    });

    await notifyCustomer({
      userId,
      title: "Refund Details Submitted",
      message: `Your refund details for order ${orderCode} have been submitted.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        method: normalizedMethod,
        action: "refund_details_submitted",
      },
    });

    await emitOrderUpdated(updated, userId);

    return this.mapOrder(updated);
  },

  async markRefundProcessing(input: MarkRefundProcessingInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!["PENDING", "READY_TO_REFUND", "PENDING_ACCOUNT_DETAILS"].includes(String(found.refund?.status || ""))) {
      throw new Error("Refund is not ready for processing");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "refund.status": "PROCESSING",
          "refund.processedAt": now,
          "refund.adminNote": adminNote,
          "refund.processedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Refund Processing",
      message: `Refund for order ${orderCode} is now processing.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "refund_processing",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async markRefunded(input: MarkRefundedInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();
    const transactionRef = String(input.transactionRef || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!found.refund || found.refund.status === "NONE") {
      throw new Error("No refund is pending for this order");
    }

    if (found.refund.status === "REFUNDED") {
      throw new Error("Refund already completed");
    }

    const now = new Date();

    const update: any = {
      "refund.status": "REFUNDED",
      "refund.processedAt": found.refund?.processedAt || now,
      "refund.refundedAt": now,
      "refund.failedAt": null,
      "refund.adminNote": adminNote,
      "refund.processedBy": mongoose.Types.ObjectId.isValid(adminId)
        ? new mongoose.Types.ObjectId(adminId)
        : null,
      refundedAt: now,
    };

    if (transactionRef) {
      update["refund.transactionRef"] = transactionRef;
    }

    if (
      String(found.orderStatus || "") === "Cancelled" ||
      String(found.orderStatus || "") === "Returned"
    ) {
      update.orderStatus = "Refunded";
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Refund Completed",
      message: `Refund for order ${orderCode} has been marked as completed.`,
      type: "payment",
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "refund_completed",
        refundStatus: "REFUNDED",
        transactionRef,
      },
    });

    await notifyAdmin({
      title: "Refund Completed",
      message: `Refund for order ${orderCode} has been marked as completed.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        action: "refund_completed",
        adminId,
        transactionRef,
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async assignReplacementDelivery(input: AssignReplacementDeliveryInput) {
    const adminId = String(input.adminId || "");
    const deliveryManId = String(input.deliveryManId || "");
    const note = String(input.note || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (found.exchange?.status !== "RECEIVED") {
      throw new Error("Returned exchange product must be received before assigning replacement delivery");
    }

    const rider = await getActiveDeliveryRider(deliveryManId);
    const now = new Date();
    const assignment = buildAssignment(rider, "REPLACEMENT_DELIVERY", note);

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          replacementDeliveryAssignment: assignment,
          "exchange.status": "REPLACEMENT_ASSIGNED",
          "exchange.replacementDeliveryManId": rider._id,
          "exchange.replacementAssignedAt": now,
          "exchange.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");
    const customerId = String(updated.customer?._id || updated.customer || "");

    await notifyDelivery({
      userId: String(rider._id),
      title: "Replacement Delivery Assigned",
      message: `Replacement delivery for exchange order ${orderCode} has been assigned to you.`,
      link: deliveryOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_assigned",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Replacement Delivery Assigned",
      message: `Replacement delivery has been assigned for your exchange order ${orderCode}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_assigned",
      },
    });

    await notifyAdmin({
      title: "Replacement Delivery Assigned",
      message: `Replacement delivery rider has been assigned for order ${orderCode}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        deliveryManId,
        assignedAt: now,
        action: "replacement_delivery_assigned",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async updateReplacementDeliveryByDelivery(input: MarkPickupStatusInput) {
    const deliveryManId = String(input.deliveryManId || "");
    const status = input.status;
    const note = String(input.note || "").trim();
    const photo = String(input.photo || "").trim();

    if (!mongoose.Types.ObjectId.isValid(deliveryManId)) {
      throw new Error("Invalid delivery user");
    }

    if (!["Picked Up", "Out for Delivery", "Delivered", "Failed Delivery"].includes(status)) {
      throw new Error("Invalid replacement delivery status");
    }

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    const assignment = found.replacementDeliveryAssignment;

    if (!assignment?.deliveryManId) {
      throw new Error("Replacement delivery task is not assigned");
    }

    if (String(assignment.deliveryManId) !== deliveryManId) {
      throw new Error("This replacement delivery task is not assigned to you");
    }

    const now = new Date();
    const nextAssignment = { ...assignment, status };

    if (note) nextAssignment.note = note;
    if (photo) nextAssignment.deliveryPhoto = photo;

    if (status === "Picked Up" && !nextAssignment.pickedUpAt) {
      nextAssignment.pickedUpAt = now;
    }

    if (status === "Out for Delivery" && !nextAssignment.outForDeliveryAt) {
      nextAssignment.outForDeliveryAt = now;
      if (!nextAssignment.pickedUpAt) nextAssignment.pickedUpAt = now;
    }

    if (status === "Delivered" && !nextAssignment.deliveredAt) {
      nextAssignment.deliveredAt = now;
      if (!nextAssignment.pickedUpAt) nextAssignment.pickedUpAt = now;
      if (!nextAssignment.outForDeliveryAt) nextAssignment.outForDeliveryAt = now;
    }

    if (status === "Failed Delivery" && !nextAssignment.failedAt) {
      nextAssignment.failedAt = now;
    }

    const update: any = {
      replacementDeliveryAssignment: nextAssignment,
    };

    if (status === "Delivered") {
      update["exchange.status"] = "REPLACEMENT_DELIVERED";
      update["exchange.replacementDeliveredAt"] = now;
    }

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      { $set: update },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyAdmin({
      title: "Replacement Delivery Updated",
      message: `Replacement delivery for order ${orderCode} is now ${status}.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        deliveryManId,
        status,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_status_updated",
      },
    });

    await notifyCustomer({
      userId: customerId,
      title: "Replacement Delivery Updated",
      message: `Replacement delivery for your exchange order ${orderCode} is now ${status}.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        status,
        taskType: "REPLACEMENT_DELIVERY",
        action: "replacement_delivery_status_updated",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async completeExchange(input: CompleteExchangeInput) {
    const adminId = String(input.adminId || "");
    const adminNote = String(input.adminNote || "").trim();

    const found: any = await findOrderByIdOrCodeRaw(input.idOrCode);
    if (!found) {
      throw new Error("Order not found");
    }

    if (!["REPLACEMENT_DELIVERED", "COMPLETED"].includes(String(found.exchange?.status || ""))) {
      throw new Error("Replacement must be delivered before completing exchange");
    }

    const now = new Date();

    const updated: any = await Order.findByIdAndUpdate(
      found._id,
      {
        $set: {
          "exchange.status": "COMPLETED",
          "exchange.completedAt": now,
          "exchange.adminNote": adminNote,
          "exchange.resolvedBy": mongoose.Types.ObjectId.isValid(adminId)
            ? new mongoose.Types.ObjectId(adminId)
            : null,
        },
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new Error("Order not found");
    }

    const customerId = String(updated.customer?._id || updated.customer || "");
    const orderId = String(updated._id);
    const orderCode = String(updated.orderCode || "");

    await notifyCustomer({
      userId: customerId,
      title: "Exchange Completed",
      message: `Your exchange for order ${orderCode} has been completed.`,
      link: orderDetailsLink(orderCode),
      meta: {
        orderId,
        orderCode,
        action: "exchange_completed",
      },
    });

    await notifyAdmin({
      title: "Exchange Completed",
      message: `Exchange for order ${orderCode} has been completed.`,
      link: adminOrderLink(orderId),
      meta: {
        orderId,
        orderCode,
        adminId,
        action: "exchange_completed",
      },
    });

    await emitOrderUpdated(updated, customerId);

    return this.mapOrder(updated);
  },

  async listReturnsRefunds(input: ListReturnsRefundsInput) {
    const type = String(input.type || "").trim().toUpperCase();
    const status = String(input.status || "").trim().toUpperCase();
    const search = String(input.search || "").trim();

    const filter: any = {
      $or: [
        { "cancelRequest.status": { $ne: "NONE" } },
        { "returnRequest.status": { $ne: "NONE" } },
        { "refund.status": { $ne: "NONE" } },
        { "exchange.status": { $ne: "NONE" } },
      ],
    };

    if (search) {
      const rx = safeRegex(search);

      const users = await User.find(
        {
          $or: [{ name: rx }, { email: rx }, { phone: rx }],
        },
        { _id: 1 }
      ).lean();

      const userIds = users.map((u: any) => u._id);

      filter.$and = [
        {
          $or: [
            { orderCode: rx },
            ...(userIds.length ? [{ customer: { $in: userIds } }] : []),
          ],
        },
      ];
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email phone")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    let rows: any[] = [];

    for (const order of orders as any[]) {
      if (order.cancelRequest?.status && order.cancelRequest.status !== "NONE") {
        rows.push(toRequestRow(order, "CANCELLATION"));
      }

      if (order.returnRequest?.status && order.returnRequest.status !== "NONE") {
        rows.push(toRequestRow(order, "RETURN"));
      }

      if (order.exchange?.status && order.exchange.status !== "NONE") {
        rows.push(toRequestRow(order, "EXCHANGE"));
      }

      if (order.refund?.status && order.refund.status !== "NONE") {
        rows.push(toRequestRow(order, "REFUND"));
      }
    }

    if (type) {
      rows = rows.filter((row) => String(row.type || "").toUpperCase() === type);
    }

    if (status) {
      rows = rows.filter(
        (row) => String(row.status || "").toUpperCase() === status
      );
    }

    rows.sort((a, b) => {
      const at = new Date(a.requestedAt || 0).getTime();
      const bt = new Date(b.requestedAt || 0).getTime();
      return bt - at;
    });

    return rows;
  },

  mapOrder(o: any) {
    const normalizeAssignment = (assignment: any) =>
      assignment
        ? {
            ...assignment,
            deliveryManId: assignment.deliveryManId
              ? String(assignment.deliveryManId)
              : "",
          }
        : null;

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
      updatedAt: o.updatedAt,
      customer: o.customer
        ? {
            id: String(o.customer._id || o.customer),
            name: o.customer.name || "",
            email: o.customer.email || "",
            phone: o.customer.phone || "",
          }
        : { id: "", name: "", email: "", phone: "" },
      items: Array.isArray(o.items)
        ? o.items.map((it: any) => ({
            ...it,
            productId: it?.productId ? String(it.productId) : "",
            variantId: it?.variantId ? String(it.variantId) : "",
            color: it?.color || "",
            colorLabel: it?.colorLabel || "",
            size: it?.size || "",
            sku: it?.sku || "",
          }))
        : [],
      address: o.address
        ? {
            ...o.address,
            lat:
              typeof o.address.lat === "number" &&
              Number.isFinite(o.address.lat)
                ? o.address.lat
                : undefined,
            lng:
              typeof o.address.lng === "number" &&
              Number.isFinite(o.address.lng)
                ? o.address.lng
                : undefined,
          }
        : null,
      shipping: o.shipping || null,
      deliveryAssignment: normalizeAssignment(o.deliveryAssignment),
      returnPickupAssignment: normalizeAssignment(o.returnPickupAssignment),
      exchangePickupAssignment: normalizeAssignment(o.exchangePickupAssignment),
      replacementDeliveryAssignment: normalizeAssignment(
        o.replacementDeliveryAssignment
      ),
      cancelRequest: o.cancelRequest || { status: "NONE" },
      returnRequest: o.returnRequest || { status: "NONE" },
      refund: o.refund || { status: "NONE" },
      exchange: o.exchange || { status: "NONE" },
      confirmedAt: o.confirmedAt || null,
      processingAt: o.processingAt || null,
      shippedAt: o.shippedAt || null,
      inTransitAt: o.inTransitAt || null,
      deliveredAt: o.deliveredAt || null,
      cancelledAt: o.cancelledAt || null,
      returnedAt: o.returnedAt || null,
      refundedAt: o.refundedAt || null,
      invoiceNo: o.invoiceNo || null,
      invoiceSentAt: o.invoiceSentAt || null,
    };
  },

  async getMyOrderDetails(userId: string, idOrCode: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

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
        productId: it.productId ? String(it.productId) : "",
        variantId: it.variantId ? String(it.variantId) : "",
        name: it.name || "",
        size: it.size || "",
        color: it.color || "",
        colorLabel: it.colorLabel || "",
        sku: it.sku || "",
        qty: Number(it.qty || 0),
        price: Math.round(Number(it.pricePaisa || 0) / 100),
        image: it.image || "",
      })
    );

    const subtotal = Math.round(Number(o.subtotalPaisa || 0) / 100);
    const shipping = Math.round(Number(o.shippingPaisa || 0) / 100);
    const discount = Math.round(Number(o.discountPaisa || 0) / 100);
    const total = Math.round(Number(o.totalPaisa || 0) / 100);

    const status = (o.orderStatus || "Confirmed") as any;

    const shipMethod = o.shipping?.method || "Standard Shipping";
    const estDelivery =
      (o.shipping?.estimatedDelivery &&
        String(o.shipping.estimatedDelivery).trim()) ||
      computeEstimatedDeliveryRange();

    return {
      orderId: o.orderCode || normalizedCode,
      id: String(o._id),
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
      cancelRequest: o.cancelRequest || { status: "NONE" },
      returnRequest: o.returnRequest || { status: "NONE" },
      refund: o.refund || { status: "NONE" },
      exchange: o.exchange || { status: "NONE" },
      invoiceNo: o.invoiceNo || null,
      invoiceSentAt: o.invoiceSentAt || null,
      address: o.address
        ? {
            ...o.address,
            lat:
              typeof o.address.lat === "number" &&
              Number.isFinite(o.address.lat)
                ? o.address.lat
                : undefined,
            lng:
              typeof o.address.lng === "number" &&
              Number.isFinite(o.address.lng)
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
      returnPickupAssignment: o.returnPickupAssignment
        ? {
            ...o.returnPickupAssignment,
            deliveryManId: o.returnPickupAssignment.deliveryManId
              ? String(o.returnPickupAssignment.deliveryManId)
              : "",
          }
        : null,
      exchangePickupAssignment: o.exchangePickupAssignment
        ? {
            ...o.exchangePickupAssignment,
            deliveryManId: o.exchangePickupAssignment.deliveryManId
              ? String(o.exchangePickupAssignment.deliveryManId)
              : "",
          }
        : null,
      replacementDeliveryAssignment: o.replacementDeliveryAssignment
        ? {
            ...o.replacementDeliveryAssignment,
            deliveryManId: o.replacementDeliveryAssignment.deliveryManId
              ? String(o.replacementDeliveryAssignment.deliveryManId)
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
          "confirmedAt",
          "processingAt",
          "shippedAt",
          "inTransitAt",
          "deliveredAt",
          "cancelledAt",
          "returnedAt",
          "refundedAt",
          "shipping",
          "deliveryAssignment",
          "returnPickupAssignment",
          "exchangePickupAssignment",
          "replacementDeliveryAssignment",
          "paymentMethod",
          "subtotalPaisa",
          "shippingPaisa",
          "discountPaisa",
          "totalPaisa",
          "address",
          "items",
          "cancelRequest",
          "returnRequest",
          "refund",
          "exchange",
        ].join(" ")
      )
      .lean();

    if (!o) return null;

    const items = (Array.isArray(o.items) ? o.items : []).map(
      (it: any, idx: number) => ({
        id: String(it.productId || idx),
        productId: it.productId ? String(it.productId) : "",
        variantId: it.variantId ? String(it.variantId) : "",
        name: it.name || "",
        size: it.size || "",
        color: it.color || "",
        colorLabel: it.colorLabel || "",
        sku: it.sku || "",
        qty: Number(it.qty || 0),
        price: Math.round(Number(it.pricePaisa || 0) / 100),
        image: it.image || "",
      })
    );

    const normalizeAssignment = (assignment: any) =>
      assignment
        ? {
            ...assignment,
            deliveryManId: assignment.deliveryManId
              ? String(assignment.deliveryManId)
              : "",
          }
        : null;

    return {
      orderCode: o.orderCode,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      confirmedAt: o.confirmedAt || null,
      processingAt: o.processingAt || null,
      shippedAt: o.shippedAt || null,
      inTransitAt: o.inTransitAt || null,
      deliveredAt: o.deliveredAt || null,
      cancelledAt: o.cancelledAt || null,
      returnedAt: o.returnedAt || null,
      refundedAt: o.refundedAt || null,
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
        discount: Math.round(Number(o.discountPaisa || 0) / 100),
        taxes: 0,
        total: Math.round(Number(o.totalPaisa || 0) / 100),
      },
      items,
      cancelRequest: o.cancelRequest || { status: "NONE" },
      returnRequest: o.returnRequest || { status: "NONE" },
      refund: o.refund || { status: "NONE" },
      exchange: o.exchange || { status: "NONE" },
      deliveryAssignment: normalizeAssignment(o.deliveryAssignment),
      returnPickupAssignment: normalizeAssignment(o.returnPickupAssignment),
      exchangePickupAssignment: normalizeAssignment(o.exchangePickupAssignment),
      replacementDeliveryAssignment: normalizeAssignment(
        o.replacementDeliveryAssignment
      ),
    };
  },
};

export default orderService;