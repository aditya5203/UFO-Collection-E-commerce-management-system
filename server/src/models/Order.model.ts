import mongoose, { Schema } from "mongoose";

export type OrderStatus =
  | "Delivered"
  | "Transit"
  | "Shipped"
  | "Confirmed"
  | "Processing"
  | "Pending"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type PaymentStatus = "Paid" | "Pending" | "Failed";
export type PaymentMethod = "COD" | "Khalti" | "eSewa" | "Fonepay";

export type CancelRequestStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED";

export type ReturnRequestStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "RECEIVED";

export type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

export type PreferredResolution = "REFUND" | "EXCHANGE";

export type RefundStatus =
  | "NONE"
  | "PENDING"
  | "PENDING_ACCOUNT_DETAILS"
  | "READY_TO_REFUND"
  | "PROCESSING"
  | "REFUNDED"
  | "FAILED";

export type RefundMethod =
  | ""
  | "COD"
  | "Khalti"
  | "eSewa"
  | "Fonepay"
  | "Manual"
  | "Bank"
  | "BANK"
  | "KHALTI"
  | "ESEWA"
  | "FONEPAY";

export type ExchangeStatus =
  | "NONE"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "PICKUP_ASSIGNED"
  | "PICKED_UP"
  | "RECEIVED"
  | "REPLACEMENT_ASSIGNED"
  | "REPLACEMENT_DELIVERED"
  | "COMPLETED";

export type DeliveryTaskType =
  | "NORMAL_DELIVERY"
  | "RETURN_PICKUP"
  | "EXCHANGE_PICKUP"
  | "REPLACEMENT_DELIVERY";

export type DeliveryAssignmentStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: false },

    variantId: {
      type: Schema.Types.ObjectId,
      required: false,
      default: null,
    },

    name: { type: String, required: true, trim: true },
    size: { type: String, required: false, default: "" },
    color: { type: String, required: false, default: "" },
    colorLabel: { type: String, required: false, default: "" },
    sku: { type: String, required: false, default: "" },

    image: { type: String, required: false, default: "" },
    qty: { type: Number, required: true, min: 1 },
    pricePaisa: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const addressSchema = new Schema(
  {
    label: { type: String, enum: ["Home", "Work", "Other"], required: false },
    email: { type: String, trim: true, default: "" },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, required: true, trim: true },
    country: { type: String, default: "Nepal" },
    provinceId: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    cityOrMunicipality: { type: String, trim: true, default: "" },
    addressLine: { type: String, trim: true, default: "" },
    street: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  { _id: false }
);

const shippingSchema = new Schema(
  {
    method: { type: String, trim: true, default: "Standard Shipping" },
    estimatedDelivery: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const couponSchema = new Schema(
  {
    code: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "" },
    scope: { type: String, trim: true, default: "" },
    value: { type: Number, default: 0 },
  },
  { _id: false }
);

const deliveryAssignmentSchema = new Schema(
  {
    taskType: {
      type: String,
      enum: [
        "NORMAL_DELIVERY",
        "RETURN_PICKUP",
        "EXCHANGE_PICKUP",
        "REPLACEMENT_DELIVERY",
      ],
      default: "NORMAL_DELIVERY",
      index: true,
    },

    deliveryManId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },

    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    vehicleType: { type: String, trim: true, default: "" },

    note: { type: String, trim: true, default: "" },
    pickupPhoto: { type: String, trim: true, default: "" },
    deliveryPhoto: { type: String, trim: true, default: "" },

    assignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    returnedToStoreAt: { type: Date, default: null },

    otpCode: { type: String, trim: true, default: "" },
    otpChannel: {
      type: String,
      enum: ["", "phone", "email"],
      default: "",
    },
    otpSentTo: { type: String, trim: true, default: "" },
    otpExpiresAt: { type: Date, default: null },
    otpLastSentAt: { type: Date, default: null },
    otpVerifiedAt: { type: Date, default: null },
    isOtpVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: [
        "Assigned",
        "Picked Up",
        "Out for Delivery",
        "Delivered",
        "Failed Delivery",
        "Returned",
        "Returned to Store",
      ],
      default: "Assigned",
      index: true,
    },
  },
  { _id: false }
);

const cancelRequestSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["NONE", "REQUESTED", "APPROVED", "REJECTED"],
      default: "NONE",
      index: true,
    },
    reason: { type: String, trim: true, default: "" },
    requestedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    adminNote: { type: String, trim: true, default: "" },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
  },
  { _id: false }
);

const returnRequestSchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "NONE",
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "PICKUP_ASSIGNED",
        "PICKED_UP",
        "RECEIVED",
      ],
      default: "NONE",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "RETURN_REFUND",
        "EXCHANGE",
        "DAMAGED",
        "WRONG_ITEM",
        "SIZE_COLOR_ISSUE",
        "NOT_SATISFIED",
        "OTHER",
      ],
      default: "RETURN_REFUND",
      index: true,
    },

    preferredResolution: {
      type: String,
      enum: ["REFUND", "EXCHANGE"],
      default: "REFUND",
      index: true,
    },

    reason: { type: String, trim: true, default: "" },
    images: { type: [String], default: [] },

    requestedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },

    adminNote: { type: String, trim: true, default: "" },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
  },
  { _id: false }
);

const refundSchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "NONE",
        "PENDING",
        "PENDING_ACCOUNT_DETAILS",
        "READY_TO_REFUND",
        "PROCESSING",
        "REFUNDED",
        "FAILED",
      ],
      default: "NONE",
      index: true,
    },

    amountPaisa: { type: Number, default: 0, min: 0 },

    method: {
      type: String,
      enum: [
        "",
        "COD",
        "Khalti",
        "eSewa",
        "Fonepay",
        "Manual",
        "Bank",
        "BANK",
        "KHALTI",
        "ESEWA",
        "FONEPAY",
      ],
      default: "",
    },

    accountName: { type: String, trim: true, default: "" },
    accountNumber: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    walletNumber: { type: String, trim: true, default: "" },
    walletId: { type: String, trim: true, default: "" },

    requestedAt: { type: Date, default: null },
    requestedDetailsAt: { type: Date, default: null },
    detailsSubmittedAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },

    adminNote: { type: String, trim: true, default: "" },
    customerNote: { type: String, trim: true, default: "" },

    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    transactionRef: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const exchangeSchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "NONE",
        "REQUESTED",
        "APPROVED",
        "REJECTED",
        "PICKUP_ASSIGNED",
        "PICKED_UP",
        "RECEIVED",
        "REPLACEMENT_ASSIGNED",
        "REPLACEMENT_DELIVERED",
        "COMPLETED",
      ],
      default: "NONE",
      index: true,
    },

    reason: { type: String, trim: true, default: "" },
    images: { type: [String], default: [] },

    replacementItems: { type: [orderItemSchema], default: [] },

    pickupDeliveryManId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },

    replacementDeliveryManId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },

    requestedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    pickupAssignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    replacementAssignedAt: { type: Date, default: null },
    replacementDeliveredAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    adminNote: { type: String, trim: true, default: "" },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: { type: [orderItemSchema], default: [] },

    subtotalPaisa: { type: Number, default: 0, min: 0 },
    shippingPaisa: { type: Number, default: 0, min: 0 },

    discountPaisa: { type: Number, default: 0, min: 0 },
    coupon: { type: couponSchema, required: false, default: null },

    totalPaisa: { type: Number, default: 0, min: 0 },

    paymentMethod: {
      type: String,
      enum: ["COD", "Khalti", "eSewa", "Fonepay"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Pending",
      index: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "Delivered",
        "Transit",
        "Shipped",
        "Confirmed",
        "Processing",
        "Pending",
        "Cancelled",
        "Returned",
        "Refunded",
      ],
      default: "Pending",
      index: true,
    },

    paymentRef: { type: String, default: null, index: true },

    shipping: { type: shippingSchema, required: false, default: null },
    address: { type: addressSchema, required: false, default: null },

    deliveryAssignment: {
      type: deliveryAssignmentSchema,
      required: false,
      default: null,
    },

    returnPickupAssignment: {
      type: deliveryAssignmentSchema,
      required: false,
      default: null,
    },

    exchangePickupAssignment: {
      type: deliveryAssignmentSchema,
      required: false,
      default: null,
    },

    replacementDeliveryAssignment: {
      type: deliveryAssignmentSchema,
      required: false,
      default: null,
    },

    cancelRequest: {
      type: cancelRequestSchema,
      required: false,
      default: () => ({
        status: "NONE",
        reason: "",
        requestedAt: null,
        resolvedAt: null,
        adminNote: "",
        resolvedBy: null,
      }),
    },

    returnRequest: {
      type: returnRequestSchema,
      required: false,
      default: () => ({
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
      }),
    },

    refund: {
      type: refundSchema,
      required: false,
      default: () => ({
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
      }),
    },

    exchange: {
      type: exchangeSchema,
      required: false,
      default: () => ({
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
      }),
    },

    confirmedAt: { type: Date, default: null },
    processingAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    inTransitAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },

    invoiceNo: { type: String, default: null },
    invoiceSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ "cancelRequest.status": 1, createdAt: -1 });
orderSchema.index({ "returnRequest.status": 1, createdAt: -1 });
orderSchema.index({ "returnRequest.type": 1, createdAt: -1 });
orderSchema.index({ "returnRequest.preferredResolution": 1, createdAt: -1 });
orderSchema.index({ "refund.status": 1, createdAt: -1 });
orderSchema.index({ "exchange.status": 1, createdAt: -1 });
orderSchema.index({ "deliveryAssignment.deliveryManId": 1, createdAt: -1 });
orderSchema.index({ "returnPickupAssignment.deliveryManId": 1, createdAt: -1 });
orderSchema.index({ "exchangePickupAssignment.deliveryManId": 1, createdAt: -1 });
orderSchema.index({
  "replacementDeliveryAssignment.deliveryManId": 1,
  createdAt: -1,
});

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);