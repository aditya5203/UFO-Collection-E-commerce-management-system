import mongoose from "mongoose";
import { Product, SIZE_OPTIONS } from "../../../models/Product.model";
import { Order } from "../../../models/Order.model";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from "../types/product.types";
import { generateProductSlug } from "../utils/slug.util";
import cloudinary from "../../../config/cloudinary";
import { getCache, setCache, deleteCacheByPattern } from "../../../utils/cache";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateDiscountPercent(price?: number, compareAtPrice?: number) {
  const nextPrice = Number(price || 0);
  const nextCompareAtPrice = Number(compareAtPrice || 0);

  return nextCompareAtPrice > nextPrice && nextPrice >= 0
    ? Math.round(((nextCompareAtPrice - nextPrice) / nextCompareAtPrice) * 100)
    : 0;
}

function normalizeVariantInput(variants: any[] | undefined) {
  if (!Array.isArray(variants)) return [];

  const seen = new Set<string>();

  return variants
    .map((variant) => {
      const color = String(variant.color || "").trim().toLowerCase();
      const size = String(variant.size || "").trim().toUpperCase();
      const stock = Number(variant.stock || 0);
      const sku = String(variant.sku || "").trim().toUpperCase();
      const isActive = variant.isActive !== false;

      return {
        color,
        size,
        stock,
        sku: sku || undefined,
        isActive,
      };
    })
    .filter((variant) => {
      if (!variant.color || !/^#([0-9a-f]{6})$/.test(variant.color)) {
        return false;
      }

      if (!SIZE_OPTIONS.includes(variant.size as any)) {
        return false;
      }

      if (Number.isNaN(variant.stock) || variant.stock < 0) {
        return false;
      }

      const key = `${variant.color}-${variant.size}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function buildProductInventory(data: {
  stock?: number;
  colors?: string[];
  sizes?: string[];
  variants?: any[];
}) {
  const variants = normalizeVariantInput(data.variants);

  if (variants.length > 0) {
    const activeVariants = variants.filter(
      (variant) => variant.isActive !== false
    );

    const stock = activeVariants.reduce(
      (total, variant) => total + Number(variant.stock || 0),
      0
    );

    const colors = Array.from(
      new Set(variants.map((variant) => variant.color).filter(Boolean))
    );

    const sizes = Array.from(
      new Set(variants.map((variant) => variant.size).filter(Boolean))
    );

    return {
      stock,
      colors,
      sizes,
      variants,
    };
  }

  const colors = Array.isArray(data.colors)
    ? data.colors.map((c) => String(c).trim().toLowerCase()).filter(Boolean)
    : [];

  const sizes = Array.isArray(data.sizes)
    ? data.sizes
        .map((s) => String(s).trim().toUpperCase())
        .filter((s) => SIZE_OPTIONS.includes(s as any))
    : [];

  return {
    stock: Number(data.stock || 0),
    colors,
    sizes,
    variants: [],
  };
}

export const productService = {
  async getAllForAdmin(query: ProductQueryDto) {
    const filter: { [key: string]: any } = {};

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ name: regex }, { slug: regex }];
    }

    if (query.status && query.status !== "All") {
      filter.status = query.status;
    }

    if (query.gender) {
      filter.gender = query.gender;
    }

    if (query.size) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [{ sizes: query.size }, { "variants.size": query.size }],
        },
      ];
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    return Product.find(filter).sort({ createdAt: -1 }).lean().exec();
  },

  async getAllPublic(query: ProductQueryDto) {
    const cacheKey = `products:public:${JSON.stringify(query)}`;

    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const filter: { [key: string]: any } = {
      status: "Active",
    };

    if (query.search) {
      const regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ name: regex }, { slug: regex }];
    }

    if (query.gender) {
      filter.gender = query.gender;
    }

    if (query.size) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [{ sizes: query.size }, { "variants.size": query.size }],
        },
      ];
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    await setCache(cacheKey, products, 300);

    return products;
  },

  async getBestSellers(limit = 8) {
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 24);
    const cacheKey = `products:best-sellers:${safeLimit}`;

    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const products = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.productId": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$items.productId",
          soldCount: { $sum: "$items.qty" },
        },
      },
      {
        $sort: {
          soldCount: -1,
        },
      },
      {
        $limit: safeLimit,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $match: {
          "product.status": "Active",
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$product", { soldCount: "$soldCount" }],
          },
        },
      },
    ]);

    await setCache(cacheKey, products, 300);

    return products;
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Product.findById(id).lean().exec();
  },

  async getPublicById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const cacheKey = `products:public:id:${id}`;

    const cached = await getCache<any>(cacheKey);
    if (cached) return cached;

    const product = await Product.findOne({
      _id: id,
      status: "Active",
    })
      .lean()
      .exec();

    await setCache(cacheKey, product, 300);

    return product;
  },

  async getRelatedProducts(productId: string, limit = 4) {
    if (!mongoose.Types.ObjectId.isValid(productId)) return [];

    const safeLimit = Math.min(Math.max(Number(limit) || 4, 1), 12);
    const cacheKey = `products:related:${productId}:${safeLimit}`;

    const cached = await getCache<any[]>(cacheKey);
    if (cached) return cached;

    const currentProduct = await Product.findOne({
      _id: productId,
      status: "Active",
    })
      .lean()
      .exec();

    if (!currentProduct) return [];

    const excludeId = new mongoose.Types.ObjectId(productId);
    const related: any[] = [];

    if (currentProduct.categoryId) {
      const categoryMatched = await Product.find({
        _id: { $ne: excludeId },
        status: "Active",
        categoryId: currentProduct.categoryId,
      })
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean()
        .exec();

      related.push(...categoryMatched);
    }

    if (related.length < safeLimit && currentProduct.gender) {
      const existingIds = related.map((p) => p._id);

      const genderMatched = await Product.find({
        _id: {
          $nin: [excludeId, ...existingIds],
        },
        status: "Active",
        gender: currentProduct.gender,
      })
        .sort({ createdAt: -1 })
        .limit(safeLimit - related.length)
        .lean()
        .exec();

      related.push(...genderMatched);
    }

    const finalRelated = related.slice(0, safeLimit);

    await setCache(cacheKey, finalRelated, 300);

    return finalRelated;
  },

  async create(data: CreateProductDto) {
    const slug = data.slug ?? generateProductSlug(data.name);

    const existing = await Product.findOne({ slug }).lean();

    if (existing) {
      const err: any = new Error(`Product '${data.name}' already exists`);
      err.statusCode = 400;
      throw err;
    }

    const uploadIfNeeded = async (src?: string) => {
      if (!src) return src;
      if (src.includes("res.cloudinary.com")) return src;
      if (src.startsWith("http://") || src.startsWith("https://")) return src;
      if (src.startsWith("/uploads/") || src.startsWith("uploads/")) return src;

      const uploaded = await cloudinary.uploader.upload(src, {
        folder: "ufo-collection/products",
        resource_type: "image",
      });

      return uploaded.secure_url || uploaded.url;
    };

    const mainImageUrl = await uploadIfNeeded(data.image);

    const galleryUrls = data.images?.length
      ? (await Promise.all(data.images.map(uploadIfNeeded))).filter(
          (u): u is string => Boolean(u)
        )
      : [];

    const inventory = buildProductInventory({
      stock: data.stock,
      colors: data.colors,
      sizes: data.sizes,
      variants: data.variants,
    });

    const product = new Product({
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      discountPercent: calculateDiscountPercent(
        data.price,
        data.compareAtPrice
      ),
      stock: inventory.stock,
      status: data.status ?? "Active",
      image: mainImageUrl ?? data.image,
      images: galleryUrls ?? [],
      gender: data.gender,
      colors: inventory.colors,
      sizes: inventory.sizes,
      variants: inventory.variants,
      categoryId: data.categoryId,
    });

    await product.save();

    await deleteCacheByPattern("products:*");

    return product.toObject();
  },

  async update(id: string, data: UpdateProductDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const update: any = { ...data };

    if (data.name && !data.slug) {
      update.slug = generateProductSlug(data.name);
    }

    if (update.slug) {
      const existing = await Product.findOne({
        slug: update.slug,
        _id: { $ne: id },
      }).lean();

      if (existing) {
        const err: any = new Error("Another product already uses this slug");
        err.statusCode = 400;
        throw err;
      }
    }

    if (data.price != null || data.compareAtPrice != null) {
      const existingProduct = await Product.findById(id).lean();

      const nextPrice = Number(data.price ?? existingProduct?.price ?? 0);
      const nextCompareAtPrice = Number(
        data.compareAtPrice ?? existingProduct?.compareAtPrice ?? 0
      );

      update.discountPercent = calculateDiscountPercent(
        nextPrice,
        nextCompareAtPrice
      );
    }

    if (Array.isArray(data.variants)) {
      const inventory = buildProductInventory({
        stock: data.stock,
        colors: data.colors,
        sizes: data.sizes,
        variants: data.variants,
      });

      update.stock = inventory.stock;
      update.colors = inventory.colors;
      update.sizes = inventory.sizes;
      update.variants = inventory.variants;
    }

    const product = await Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();

    await deleteCacheByPattern("products:*");

    return product;
  },

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const product = await Product.findByIdAndDelete(id).lean().exec();

    await deleteCacheByPattern("products:*");

    return product;
  },
};