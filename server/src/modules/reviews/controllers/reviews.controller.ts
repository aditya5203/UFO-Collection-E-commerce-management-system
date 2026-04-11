import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../../../middleware/error.middleware";
import { Review } from "../../../models/Review.model";
import { Order } from "../../../models/Order.model";
import { Product } from "../../../models/Product.model";
import { User } from "../../../models/User.model";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { notificationService } from "../../notifications/services/notification.service";

function normalizeOrderCode(v: string) {
  const raw = String(v || "").trim();
  if (!raw) return "";
  return raw.startsWith("#") ? raw : `#${raw}`;
}

export const reviewController = {
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

      const order = await Order.findOne({
        orderCode,
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
        title: typeof title === "string" ? title.trim() : "",
        comment: typeof comment === "string" ? comment.trim() : "",
      });

      try {
        const [productDoc, customerDoc] = await Promise.all([
          Product.findById(product).select("name").lean(),
          User.findById(customer).select("name email").lean(),
        ]);

        const customerName =
          (customerDoc as any)?.name ||
          (customerDoc as any)?.email ||
          "Customer";

        const productName = (productDoc as any)?.name || "Product";

        await notificationService.createAdminForAll({
          title: "New review posted",
          message: `${customerName} posted a ${ratingNum}★ review on ${productName}.`,
          type: "review",
          link: "/admin/reviews",
          meta: {
            reviewId: String((created as any)._id),
            productId: String(product),
            productName,
            customerId: String(customer),
            customerName,
            rating: ratingNum,
            orderCode,
          },
        });
      } catch (e: any) {
        console.log("Review notification failed (ignored):", e?.message);
      }

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