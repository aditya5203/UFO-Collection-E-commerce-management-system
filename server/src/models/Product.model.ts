//models/Product.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type ProductStatus = "Active" | "Inactive";
export type Gender = "Male" | "Female";
export type Size = "S" | "M" | "L" | "XL" | "XXL";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  images?: string[];
  gender: Gender;
  colors: string[];
  sizes: Size[];
  categoryId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // ❌ category removed

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    image: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
      index: true,
    },
    colors: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
          message: "At least one color is required",
        },
        {
          validator: (arr: string[]) =>
            Array.isArray(arr) &&
            arr.every((c) => /^#([0-9a-fA-F]{6})$/.test(c)),
          message: "Each color must be a hex string like #AABBCC",
        },
      ],
      set: (arr: string[]) =>
        Array.isArray(arr) ? arr.map((c) => c.trim().toLowerCase()) : arr,
    },
    sizes: {
      type: [String],
      enum: ["S", "M", "L", "XL", "XXL"],
      required: true,
      validate: [
        (arr: string[]) => Array.isArray(arr) && arr.length > 0,
        "At least one size is required",
      ],
      set: (arr: string[]) => (Array.isArray(arr) ? arr.map((s) => s.trim().toUpperCase()) : arr),
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = model<IProduct>("Product", productSchema);

// Cleanup legacy indexes (if sku unique index exists)
Product.on("index", async () => {
  try {
    const indexes = await Product.collection.indexes();
    const hasSku = indexes.some((idx: any) => idx.name === "sku_1");
    if (hasSku) {
      await Product.collection.dropIndex("sku_1");
    }
  } catch (err) {
    // swallow errors to avoid crashing app on startup
  }
});
