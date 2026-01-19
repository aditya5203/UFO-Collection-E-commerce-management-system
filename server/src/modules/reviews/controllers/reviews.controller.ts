import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../../../middleware/error.middleware";
import { Review } from "../../../models/Review.model";
import { Order } from "../../../models/Order.model";
import { AuthRequest } from "../../auth/middleware/auth.middleware";

// ✅ FIXED: your DB stores orderCode WITH "#"
function normalizeOrderCode(v: string) {
  const raw = String(v || "").trim();
  if (!raw) return "";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

export const reviewController = {
  // =======================================================
  // GET /api/products/:productId/reviews
  // =======================================================
  getByProduct: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError("Invalid product id", 400);
      }

      const product = new mongoose.Types.ObjectId(productId);

      const reviews = await Review.find({ product })
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

      const count = reviews.length;
      const avgRating =
        count > 0
          ? Number(
              (
                reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                count
              ).toFixed(2)
            )
          : 0;

      res.status(200).json({
        success: true,
        reviews,
        summary: { count, avgRating },
      });
    } catch (err) {
      next(err);
    }
  },

  // =======================================================
  // POST /api/products/:productId/reviews (customer)
  // body: { rating, title, comment, orderId }
  // =======================================================
  create: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError("Invalid product id", 400);
      }

      const customerId = req.user?.userId;
      if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
        throw new AppError("User not authenticated", 401);
      }

      const { rating, title, comment, orderId } = req.body || {};
      const ratingNum = Number(rating);

      if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
        throw new AppError("Rating must be between 1 and 5", 400);
      }

      const orderCode = normalizeOrderCode(orderId);
      if (!orderCode) throw new AppError("orderId is required", 400);

      const product = new mongoose.Types.ObjectId(productId);
      const customer = new mongoose.Types.ObjectId(customerId);

      // ✅ allow review only if Delivered + purchased
      const order = await Order.findOne({
        orderCode,                    // ✅ now matches "#123456"
        customer,
        orderStatus: "Delivered",
        "items.productId": product,
      }).lean();

      if (!order) {
        throw new AppError("You can review only delivered purchased items.", 403);
      }

      const created = await Review.create({
        product,
        customer,
        orderCode,
        rating: ratingNum,
        title: typeof title === "string" ? title : "",
        comment: typeof comment === "string" ? comment : "",
      });

      res.status(201).json({
        success: true,
        message: "Review submitted",
        review: created,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return next(
          new AppError("You already reviewed this item for this order.", 409)
        );
      }
      next(err);
    }
  },
};
