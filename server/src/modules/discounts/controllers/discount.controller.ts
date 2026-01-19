import { Response } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import discountService from "../services/discount.service";
import { Product } from "../../../models/Product.model";
import mongoose from "mongoose";

export const discountController = {
  // ✅ PUBLIC: AVAILABLE COUPONS
  // GET /api/discounts/available
  async available(_req: AuthRequest, res: Response) {
    try {
      const data = await discountService.listAvailable();
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch coupons" });
    }
  },

  // ✅ CUSTOMER: COLLECT ALL
  // POST /api/discounts/collect-all
  async collectAll(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = await discountService.collectAllAvailable(userId);
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err?.message || "Failed to collect all coupons" });
    }
  },

  // CUSTOMER: COLLECT
  async collect(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { code } = req.params;
      const data = await discountService.collectCoupon(userId, code);
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err?.message || "Failed to collect coupon" });
    }
  },

  // CUSTOMER: MY COLLECTED
  async myCollected(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = await discountService.listMyCollected(userId);
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch coupons" });
    }
  },

  // CUSTOMER: VALIDATE
  async validate(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { couponCode = "", items = [], shippingPaisa = 0 } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const qtyByProductId = new Map<string, number>();
      for (const it of items) {
        const id = String(it.productId);
        const qty = Math.max(1, Number(it.qty || 1));
        qtyByProductId.set(id, (qtyByProductId.get(id) || 0) + qty);
      }

      const productIds = Array.from(qtyByProductId.keys()).filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      const products = await Product.find({ _id: { $in: productIds } })
        .select("_id name price stock status image images categoryId")
        .lean();

      const productMap = new Map<string, any>(products.map((p: any) => [String(p._id), p]));

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
      return res.status(400).json({ message: err?.message || "Failed to validate coupon" });
    }
  },

  // ADMIN: LIST
  async adminList(_req: AuthRequest, res: Response) {
    try {
      const data = await discountService.adminList();
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to list coupons" });
    }
  },

  // ADMIN: CREATE
  async adminCreate(req: AuthRequest, res: Response) {
    try {
      const data = await discountService.adminCreate(req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err?.message || "Failed to create coupon" });
    }
  },

  // ADMIN: UPDATE
  async adminUpdate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await discountService.adminUpdate(id, req.body);
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err?.message || "Failed to update coupon" });
    }
  },

  // ADMIN: DELETE
  async adminDelete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await discountService.adminDelete(id);
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(400).json({ message: err?.message || "Failed to delete coupon" });
    }
  },

  // ADMIN: COLLECTED LIST
  async adminCollected(_req: AuthRequest, res: Response) {
    try {
      const data = await discountService.adminCollected();
      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch collected list" });
    }
  },
};
