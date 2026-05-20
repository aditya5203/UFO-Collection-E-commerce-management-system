import { Schema, model, Document, Types, Model } from "mongoose";

export type ProductStatus = "Active" | "Inactive";
export type Gender = "Male" | "Female";

export type Size =
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "38"
  | "39"
  | "40"
  | "41"
  | "42"
  | "43"
  | "44"
  | "45";

export const SIZE_OPTIONS: Size[] = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
];

export interface IProductVariant {
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;

  price: number;
  compareAtPrice?: number;
  discountPercent: number;

  stock: number;
  status: ProductStatus;
  image: string;
  images?: string[];
  gender: Gender;
  colors: string[];
  sizes: Size[];
  variants: IProductVariant[];
  categoryId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    color: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) => /^#([0-9a-fA-F]{6})$/.test(value),
        message: "Variant color must be a hex string like #000000",
      },
    },
    size: {
      type: String,
      enum: SIZE_OPTIONS,
      required: true,
      set: (value: string) => String(value || "").trim().toUpperCase(),
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  }
);

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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
      enum: SIZE_OPTIONS,
      required: true,
      validate: [
        {
          validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
          message: "At least one size is required",
        },
      ],
      set: (arr: string[]) =>
        Array.isArray(arr) ? arr.map((s) => s.trim().toUpperCase()) : arr,
    },
    variants: {
      type: [productVariantSchema],
      default: [],
      validate: {
        validator: function (variants: IProductVariant[]) {
          if (!Array.isArray(variants)) return false;

          const seen = new Set<string>();

          for (const variant of variants) {
            const color = String(variant.color || "").trim().toLowerCase();
            const size = String(variant.size || "").trim().toUpperCase();
            const key = `${color}-${size}`;

            if (seen.has(key)) return false;

            seen.add(key);
          }

          return true;
        },
        message: "Duplicate color and size variant is not allowed",
      },
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

productSchema.pre("validate", function () {
  const price = Number(this.price || 0);
  const compareAtPrice = Number(this.compareAtPrice || 0);

  this.discountPercent =
    compareAtPrice > price && price >= 0
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  if (Array.isArray(this.variants) && this.variants.length > 0) {
    const activeVariants = this.variants.filter(
      (variant) => variant.isActive !== false
    );

    this.stock = activeVariants.reduce(
      (total, variant) => total + Number(variant.stock || 0),
      0
    );

    this.colors = Array.from(
      new Set(
        this.variants
          .map((variant) => String(variant.color || "").trim().toLowerCase())
          .filter(Boolean)
      )
    );

    this.sizes = Array.from(
      new Set(
        this.variants
          .map((variant) => String(variant.size || "").trim().toUpperCase())
          .filter(Boolean)
      )
    ) as Size[];
  }
});

export const Product: Model<IProduct> = model<IProduct>(
  "Product",
  productSchema
);

// Cleanup legacy indexes if sku unique index exists
Product.on("index", async () => {
  try {
    const indexes = await Product.collection.indexes();
    const hasSku = indexes.some((idx: any) => idx.name === "sku_1");

    if (hasSku) {
      await Product.collection.dropIndex("sku_1");
    }
  } catch {
    // swallow errors to avoid crashing app on startup
  }
});