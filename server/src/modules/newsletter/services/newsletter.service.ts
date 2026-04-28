// server/src/modules/newsletter/services/newsletter.service.ts

import mongoose from "mongoose";
import { Coupon } from "../../../models/Coupon.model";
import { UserCoupon } from "../../../models/UserCoupon.model";

const NEWSLETTER_COUPON_CODE = "WELCOME20";

export const newsletterService = {
  async subscribe(email: string, userId?: string) {
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error("Email is required");
    }

    // validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Invalid email address");
    }

    // find or create coupon
    let coupon = await Coupon.findOne({ code: NEWSLETTER_COUPON_CODE });

    if (!coupon) {
      coupon = await Coupon.create({
        code: NEWSLETTER_COUPON_CODE,
        title: "Newsletter 20% Off",
        description: "Get 20% off by subscribing",
        type: "PERCENT",
        scope: "ALL",
        value: 20,
        status: "ACTIVE",
        usedCount: 0,
        maxUsesPerUser: 1,
      });
    }

    let autoCollected = false;

    // if user logged in → auto collect
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const exists = await UserCoupon.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: coupon._id,
      });

      if (!exists) {
        await UserCoupon.create({
          userId: new mongoose.Types.ObjectId(userId),
          couponId: coupon._id,
          status: "COLLECTED",
        });

        autoCollected = true;
      }
    }

    return {
      couponCode: coupon.code,
      autoCollected,
    };
  },
};

export default newsletterService;