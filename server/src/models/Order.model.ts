import mongoose, { Schema } from "mongoose";

export type OrderStatus =
  | "Delivered"
  | "Transit"
  | "Shipped"
  | "Confirmed"
  | "Pending"
  | "Cancelled";

export type PaymentStatus = "Paid" | "Pending" | "Failed";
export type PaymentMethod = "COD" | "Khalti" | "eSewa" | "Fonepay";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: false },
    name: { type: String, required: true, trim: true },
    size: { type: String, required: false, default: "" },
    color: { type: String, required: false, default: "" },
    colorLabel: { type: String, required: false, default: "" },
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
    assignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },

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
      ],
      default: "Assigned",
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
      enum: ["Delivered", "Transit", "Shipped", "Confirmed", "Pending", "Cancelled"],
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

    confirmedAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    inTransitAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    invoiceNo: { type: String, default: null },
    invoiceSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);