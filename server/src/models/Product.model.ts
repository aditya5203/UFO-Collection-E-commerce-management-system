import { Schema, model, Document, Types } from "mongoose";
import type { MainCategory, CustomerType } from "./Category.model";

export type ProductStatus = "Active" | "Draft" | "Archived";

export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  images?: string[];

  mainCategory: MainCategory;
  subCategory: string;
  customer: CustomerType;

  categoryId?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
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
      enum: ["Active", "Draft", "Archived"],
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

    mainCategory: {
      type: String,
      enum: ["Clothes", "Shoes"],
      required: true,
    },

    subCategory: {
      type: String,
      required: true,
      trim: true,
    },

    customer: {
      type: String,
      enum: ["Men", "Women", "Boys", "Girls"],
      required: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Product = model<IProduct>("Product", productSchema);
