import mongoose, { Schema, Types } from "mongoose";

export type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
export type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";
export type CouponStatus = "ACTIVE" | "PAUSED";

export interface ICoupon {
  code: string; // UNIQUE, uppercase
  title: string;
  description?: string;

  type: CouponType;
  scope: CouponScope;

  /**
   * value:
   * - PERCENT: 1-100
   * - FLAT: rupees amount (e.g. 200 means Rs.200 off)
   * - FREESHIP: value ignored (can be 0)
   */
  value: number;

  // optional constraints (rupees based; we convert to paisa when calculating)
  maxDiscountCap?: number; // percent coupons cap in rupees
  minOrder?: number; // min cart subtotal in rupees

  eligibleCategoryIds?: Types.ObjectId[];
  eligibleProductIds?: Types.ObjectId[];

  startAt?: Date | null;
  endAt?: Date | null;

  globalUsageLimit?: number | null;
  usedCount: number;

  maxUsesPerUser?: number | null;

  status: CouponStatus;

  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    type: { type: String, enum: ["PERCENT", "FLAT", "FREESHIP"], required: true },
    scope: { type: String, enum: ["ALL", "CATEGORY", "PRODUCT"], default: "ALL" },

    value: { type: Number, required: true, min: 0 },

    maxDiscountCap: { type: Number, default: null },
    minOrder: { type: Number, default: null },

    eligibleCategoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    eligibleProductIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],

    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },

    globalUsageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },

    maxUsesPerUser: { type: Number, default: null },

    status: { type: String, enum: ["ACTIVE", "PAUSED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", couponSchema);
