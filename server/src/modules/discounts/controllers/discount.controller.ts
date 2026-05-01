// server/src/modules/discounts/controllers/discount.controller.ts

import { Response } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import discountService from "../services/discount.service";
import { Product } from "../../../models/Product.model";
import mongoose from "mongoose";

export const discountController = {
  async available(_req: AuthRequest, res: Response) {
    try {
      const data = await discountService.listAvailable();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: "COUPONS_FETCH_FAILED",
        message: err?.message || "Failed to fetch coupons",
      });
    }
  },

  async collectAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      const data = await discountService.collectAllAvailable(userId);

      return res.status(200).json({
        success: true,
        message: "Coupons collected successfully",
        data,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        code: "COLLECT_ALL_FAILED",
        message: err?.message || "Failed to collect all coupons",
      });
    }
  },

  async collect(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      const { code } = req.params;
      const data = await discountService.collectCoupon(userId, code);

      return res.status(200).json({
        success: true,
        message: "Coupon collected successfully",
        data,
      });
    } catch (err: any) {
      const message = String(err?.message || "Failed to collect coupon");
      const lower = message.toLowerCase();

      if (lower.includes("already collected")) {
        return res.status(409).json({
          success: false,
          code: "COUPON_ALREADY_COLLECTED",
          message: "You already collected this coupon.",
        });
      }

      if (lower.includes("not found")) {
        return res.status(404).json({
          success: false,
          code: "COUPON_NOT_FOUND",
          message,
        });
      }

      if (
        lower.includes("expired") ||
        lower.includes("not started") ||
        lower.includes("not active")
      ) {
        return res.status(400).json({
          success: false,
          code: "COUPON_NOT_AVAILABLE",
          message,
        });
      }

      return res.status(400).json({
        success: false,
        code: "COUPON_COLLECT_FAILED",
        message,
      });
    }
  },

  async myCollected(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      const data = await discountService.listMyCollected(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: "MY_COUPONS_FETCH_FAILED",
        message: err?.message || "Failed to fetch coupons",
      });
    }
  },

  async validate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      const { couponCode = "", items = [], shippingPaisa = 0 } = req.body || {};

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          code: "EMPTY_CART",
          message: "Cart is empty",
        });
      }

      const qtyByProductId = new Map<string, number>();

      for (const it of items) {
        const id = String(it.productId || "");
        const qty = Math.max(1, Number(it.qty || 1));

        if (!id) continue;

        qtyByProductId.set(id, (qtyByProductId.get(id) || 0) + qty);
      }

      const productIds = Array.from(qtyByProductId.keys()).filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      const products = await Product.find({ _id: { $in: productIds } })
        .select("_id name price stock status image images categoryId")
        .lean();

      const productMap = new Map<string, any>(
        products.map((p: any) => [String(p._id), p])
      );

      let subtotalPaisa = 0;

      for (const [pid, qty] of qtyByProductId.entries()) {
        const p: any = productMap.get(pid);
        if (!p) continue;

        const pricePaisa = Math.round(Number(p.price || 0) * 100);
        subtotalPaisa += pricePaisa * qty;
      }

      const ship = Math.max(0, Number(shippingPaisa || 0));

      const out = await discountService.computeDiscountPaisa({
        userId,
        couponCode,
        items,
        productMap,
        subtotalPaisa,
        shippingPaisa: ship,
      });

      const totalPaisa = Math.max(0, subtotalPaisa + ship - out.discountPaisa);

      return res.status(200).json({
        success: true,
        data: {
          subtotalPaisa,
          shippingPaisa: ship,
          discountPaisa: out.discountPaisa,
          totalPaisa,
          applied: out.applied,
          userCouponId: out.userCouponId,
        },
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        code: "COUPON_VALIDATE_FAILED",
        message: err?.message || "Failed to validate coupon",
      });
    }
  },

  async adminList(_req: AuthRequest, res: Response) {
    try {
      const data = await discountService.adminList();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: "ADMIN_COUPON_LIST_FAILED",
        message: err?.message || "Failed to list coupons",
      });
    }
  },

  async adminCreate(req: AuthRequest, res: Response) {
    try {
      const data = await discountService.adminCreate(req.body);

      return res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data,
      });
    } catch (err: any) {
      const message = String(err?.message || "Failed to create coupon");
      const lower = message.toLowerCase();

      if (lower.includes("already exists")) {
        return res.status(409).json({
          success: false,
          code: "COUPON_CODE_ALREADY_EXISTS",
          message,
        });
      }

      return res.status(400).json({
        success: false,
        code: "ADMIN_COUPON_CREATE_FAILED",
        message,
      });
    }
  },

  async adminUpdate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await discountService.adminUpdate(id, req.body);

      return res.status(200).json({
        success: true,
        message: "Coupon updated successfully",
        data,
      });
    } catch (err: any) {
      const message = String(err?.message || "Failed to update coupon");
      const lower = message.toLowerCase();

      if (lower.includes("not found")) {
        return res.status(404).json({
          success: false,
          code: "COUPON_NOT_FOUND",
          message,
        });
      }

      return res.status(400).json({
        success: false,
        code: "ADMIN_COUPON_UPDATE_FAILED",
        message,
      });
    }
  },

  async adminDelete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await discountService.adminDelete(id);

      return res.status(200).json({
        success: true,
        message: "Coupon deleted successfully",
        data,
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        code: "ADMIN_COUPON_DELETE_FAILED",
        message: err?.message || "Failed to delete coupon",
      });
    }
  },

  async adminCollected(_req: AuthRequest, res: Response) {
    try {
      const data = await discountService.adminCollected();

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        code: "ADMIN_COLLECTED_COUPONS_FETCH_FAILED",
        message: err?.message || "Failed to fetch collected list",
      });
    }
  },
};