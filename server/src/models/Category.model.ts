import { Document, Schema, model, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parent?: Types.ObjectId | null;
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
      default: '',
      trim: true,
    },

    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export const Category = model<ICategory>('Category', CategorySchema);
