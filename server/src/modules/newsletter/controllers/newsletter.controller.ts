// server/src/modules/newsletter/controllers/newsletter.controller.ts

import { Response } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import newsletterService from "../services/newsletter.service";

export const newsletterController = {
  async subscribe(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body || {};
      const userId = req.user?.userId;

      const data = await newsletterService.subscribe(email, userId);

      return res.status(200).json({
        success: true,
        message: data.autoCollected
          ? "Subscribed successfully. 20% coupon added to your account."
          : `Subscribed successfully. Use code ${data.couponCode} for 20% off.`,
        data,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err?.message || "Subscription failed",
      });
    }
  },
};