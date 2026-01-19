import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../../../middleware/error.middleware";
import { Review } from "../../../models/Review.model";

function safeRegex(input: string) {
  return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export const adminReviewsController = {
  // GET /api/admin/reviews
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        search = "",
        productId,
        customerId,
        rating,
        page = "1",
        limit = "20",
      } = req.query as Record<string, string>;

      const filter: any = {};

      // filters
      if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        filter.product = new mongoose.Types.ObjectId(productId);
      }
      if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
        filter.customer = new mongoose.Types.ObjectId(customerId);
      }
      if (rating) {
        const r = Number(rating);
        if (!Number.isNaN(r) && r >= 1 && r <= 5) filter.rating = r;
      }

      // search (title/comment/orderCode)
      if (search.trim()) {
        const rx = safeRegex(search.trim());
        filter.$or = [{ title: rx }, { comment: rx }, { orderCode: rx }];
      }

      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        Review.find(filter)
          .populate("product", "name image")
          .populate("customer", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Review.countDocuments(filter),
      ]);

      const reviews = (items as any[]).map((r) => ({
        id: String(r._id),

        rating: Number(r.rating || 0),
        title: r.title || "",
        comment: r.comment || "",
        orderCode: r.orderCode || "",

        createdAt: r.createdAt,
        updatedAt: r.updatedAt,

        product: r.product
          ? {
              id: String(r.product._id),
              name: r.product.name || "",
              image: r.product.image || "",
            }
          : null,

        customer: r.customer
          ? {
              id: String(r.customer._id),
              name: r.customer.name || "",
              email: r.customer.email || "",
            }
          : null,
      }));

      res.status(200).json({
        success: true,
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/admin/reviews/:id
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid review id", 400);
      }

      const deleted = await Review.findByIdAndDelete(id).lean();
      if (!deleted) throw new AppError("Review not found", 404);

      res.status(200).json({
        success: true,
        message: "Review deleted",
      });
    } catch (err) {
      next(err);
    }
  },
};
