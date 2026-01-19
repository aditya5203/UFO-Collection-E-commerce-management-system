import mongoose, { Schema } from "mongoose";

export type UserCouponStatus = "COLLECTED" | "USED" | "EXPIRED";

export interface IUserCoupon {
  userId: any;
  couponId: any;

  status: UserCouponStatus;

  collectedAt: Date;
  usedAt?: Date | null;

  orderId?: any | null;

  createdAt: Date;
  updatedAt: Date;
}

const userCouponSchema = new Schema<IUserCoupon>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true, index: true },

    status: { type: String, enum: ["COLLECTED", "USED", "EXPIRED"], default: "COLLECTED", index: true },

    collectedAt: { type: Date, default: () => new Date() },
    usedAt: { type: Date, default: null },

    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

// Prevent duplicate collect
userCouponSchema.index({ userId: 1, couponId: 1 }, { unique: true });

export const UserCoupon =
  mongoose.models.UserCoupon || mongoose.model<IUserCoupon>("UserCoupon", userCouponSchema);
