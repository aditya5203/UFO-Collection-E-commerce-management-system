import mongoose from "mongoose";
import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";
import { notificationService } from "../../notifications/services/notification.service";
import { getIO } from "../../../socket";


export type ListInput = {
  search?: string;
  customerId?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

export type DeliveryStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

export type DeliveryTaskType =
  | "NORMAL_DELIVERY"
  | "RETURN_PICKUP"
  | "EXCHANGE_PICKUP"
  | "REPLACEMENT_DELIVERY";

export type UpdateInput = {
  paymentStatus?: string;
  orderStatus?: string;
  deliveryAssignment?: {
    deliveryManId?: string;
    note?: string;
    status?: DeliveryStatus;
  };
};

export type CreateOrderBody = {
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

export type RequestCancellationInput = {
  userId: string;
  idOrCode: string;
  reason: string;
};

export type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

export type PreferredResolution = "REFUND" | "EXCHANGE";

export type RequestReturnInput = {
  userId: string;
  idOrCode: string;
  reason: string;
  type?: ReturnRequestType;
  preferredResolution?: PreferredResolution;
  images?: string[];
};

export type AdminRequestActionInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

export type AssignPickupInput = {
  adminId: string;
  idOrCode: string;
  deliveryManId: string;
  note?: string;
};

export type MarkPickupStatusInput = {
  deliveryManId: string;
  idOrCode: string;
  taskType?: DeliveryTaskType;
  status: DeliveryStatus;
  note?: string;
  photo?: string;
};

export type MarkProductReceivedInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

export type RequestRefundDetailsInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

export type SubmitRefundDetailsInput = {
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

export type MarkRefundProcessingInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

export type MarkRefundedInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
  transactionRef?: string;
};

export type AssignReplacementDeliveryInput = {
  adminId: string;
  idOrCode: string;
  deliveryManId: string;
  note?: string;
};

export type CompleteExchangeInput = {
  adminId: string;
  idOrCode: string;
  adminNote?: string;
};

export type ListReturnsRefundsInput = {
  type?: string;
  status?: string;
  search?: string;
};

export function safeRegex(input: string) {
  return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export function normalizeNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeHexColor(value: any) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeSize(value: any) {
  return String(value || "").trim().toUpperCase();
}

export function getVariantId(variant: any) {
  return String(variant?._id || variant?.id || "").trim();
}

export function norm(value: any) {
  return String(value || "").trim().toLowerCase();
}

export function isPaidLike(value: any) {
  const v = norm(value);
  return ["paid", "success", "successful", "completed"].includes(v);
}

export function getRefundMethod(paymentMethod: any) {
  const method = String(paymentMethod || "").trim();

  if (["COD", "Khalti", "eSewa", "Fonepay"].includes(method)) {
    return method;
  }

  return "Manual";
}

export function orderDetailsLink(orderCode: string) {
  const clean = String(orderCode || "").replace(/^#/, "").trim();
  return clean ? `/customerorderdetails/${clean}` : "/profile/orders";
}

export function deliveryOrderLink(orderId: string) {
  return `/delivery/orders/${orderId}`;
}

export function adminOrderLink(orderId: string) {
  return `/admin/orders/${orderId}`;
}

export function adminReturnsRefundsLink() {
  return "/admin/returns-refunds";
}

export function buildShippingAddressText(address: any) {
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

export function computeEstimatedDeliveryRange() {
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

export async function generateUniqueOrderCode() {
  for (let i = 0; i < 10; i++) {
    const code = `#${Math.floor(100000 + Math.random() * 900000)}`;
    const exists = await Order.findOne({ orderCode: code }).lean();
    if (!exists) return code;
  }

  return `#${Date.now().toString().slice(-6)}`;
}

export function findMatchingVariant(product: any, item: any) {
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

export async function findOrderByIdOrCodeRaw(idOrCode: string) {
  const raw = String(idOrCode || "").trim();
  if (!raw) return null;

  if (mongoose.Types.ObjectId.isValid(raw)) {
    const byId = await Order.findById(raw).lean();
    if (byId) return byId;
  }

  const normalizedCode = raw.startsWith("#") ? raw : `#${raw}`;

  return Order.findOne({ orderCode: normalizedCode }).lean();
}

export async function findCustomerOrderRaw(userId: string, idOrCode: string) {
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

export async function notifyAdmin(payload: {
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

export async function notifyCustomer(payload: {
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

export async function notifyDelivery(payload: {
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

export async function emitOrderUpdated(updated: any, fallbackCustomerId?: string) {
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

export function buildOrderCreatedPayload(doc: any, userId: string) {
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

export async function restockOrderItems(order: any) {
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

export function buildRefundAfterCancellation(order: any) {
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

export function buildRefundAfterProductReceived(order: any) {
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

export function isReturnWindowAllowed(order: any) {
  if (String(order?.orderStatus || "") !== "Delivered") return false;

  const deliveredAt = order?.deliveredAt;
  if (!deliveredAt) return true;

  const deliveredDate = new Date(deliveredAt);
  if (Number.isNaN(deliveredDate.getTime())) return true;

  const now = Date.now();
  const diffDays = (now - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

  return diffDays <= 7;
}

export async function getActiveDeliveryRider(deliveryManId: string) {
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

export function buildAssignment(rider: any, taskType: DeliveryTaskType, note?: string) {
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

export function normalizeImages(images: any) {
  if (!Array.isArray(images)) return [];
  return images
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function isExchangeResolution(order: any) {
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

export function toRequestRow(
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


export function mapOrder(o: any) {
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
}
