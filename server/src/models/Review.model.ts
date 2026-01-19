import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // we store orderCode (your orderCode)
    orderCode: { type: String, required: true, index: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", trim: true },
    comment: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// ✅ only 1 review per customer per product per orderCode
reviewSchema.index({ product: 1, customer: 1, orderCode: 1 }, { unique: true });

export const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
