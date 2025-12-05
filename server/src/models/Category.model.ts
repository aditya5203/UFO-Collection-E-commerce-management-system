import { Document, Schema, model, Types } from "mongoose";

export type MainCategory = "Clothes" | "Shoes";
export type CustomerType = "Men" | "Women" | "Boys" | "Girls";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parent?: Types.ObjectId | null;

  // Main parent category (Clothes / Shoes)
  mainCategory: MainCategory;

  // Customer group (Men / Women / Boys / Girls)
  customer: CustomerType;

  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      default: "",
      trim: true,
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Main category (Clothes / Shoes)
    mainCategory: {
      type: String,
      enum: ["Clothes", "Shoes"],
      required: true,
      index: true,
    },

    // Customer type (Men / Women / Boys / Girls)
    customer: {
      type: String,
      enum: ["Men", "Women", "Boys", "Girls"],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category = model<ICategory>("Category", CategorySchema);
