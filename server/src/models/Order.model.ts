// server/src/models/Order.model.ts
import mongoose, { Schema } from "mongoose";

export type OrderStatus = "Delivered" | "Shipped" | "Pending" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Failed";
export type PaymentMethod = "COD" | "Khalti" | "eSewa";

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: false },
    name: { type: String, required: true, trim: true },
    size: { type: String, required: false, default: "" },
    image: { type: String, required: false, default: "" },
    qty: { type: Number, required: true, min: 1 },
    pricePaisa: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// ✅ Address snapshot schema
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
  },
  { _id: false }
);

// ✅ Shipping snapshot schema
const shippingSchema = new Schema(
  {
    method: { type: String, trim: true, default: "Standard Shipping" },
    estimatedDelivery: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// ✅ Coupon snapshot schema
const couponSchema = new Schema(
  {
    code: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "" },  // PERCENT | FLAT | FREESHIP
    scope: { type: String, trim: true, default: "" }, // ALL | CATEGORY | PRODUCT
    value: { type: Number, default: 0 },
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

    // ✅ Discount fields
    discountPaisa: { type: Number, default: 0, min: 0 },
    coupon: { type: couponSchema, required: false, default: null },

    totalPaisa: { type: Number, default: 0, min: 0 },

    paymentMethod: {
      type: String,
      enum: ["COD", "Khalti", "eSewa"],
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
      enum: ["Delivered", "Shipped", "Pending", "Cancelled"],
      default: "Pending",
      index: true,
    },

    paymentRef: { type: String, default: null, index: true },

    shipping: { type: shippingSchema, required: false, default: null },
    address: { type: addressSchema, required: false, default: null },

    // ✅ NEW: Invoice fields
    invoiceNo: { type: String, default: null },
    invoiceSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
