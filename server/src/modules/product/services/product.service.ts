// modules/auth/product/services/product.service.ts
import mongoose from "mongoose";
import { Product } from "../../../models/Product.model";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from "../types/product.types";
import { generateProductSlug } from "../utils/slug.util";
import cloudinary from "../../../config/cloudinary";

export const productService = {
  async getAllForAdmin(query: ProductQueryDto) {
    const filter: { [key: string]: any } = {};

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ name: regex }, { slug: regex }];
    }

    if (query.status && query.status !== "All") {
      filter.status = query.status;
    }

    if (query.gender) filter.gender = query.gender;
    if (query.size) filter.sizes = query.size;
    if (query.categoryId) filter.categoryId = query.categoryId;

    return Product.find(filter).sort({ createdAt: -1 }).lean().exec();
  },

  async getAllPublic(query: ProductQueryDto) {
    const filter: { [key: string]: any } = { status: "Active" };

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ name: regex }, { slug: regex }];
    }

    if (query.gender) filter.gender = query.gender;
    if (query.size) filter.sizes = query.size;
    if (query.categoryId) filter.categoryId = query.categoryId;

    return Product.find(filter).sort({ createdAt: -1 }).lean().exec();
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Product.findById(id).lean().exec();
  },

  async getRelatedProducts(productId: string, limit = 4) {
    if (!mongoose.Types.ObjectId.isValid(productId)) return [];

    const currentProduct = await Product.findById(productId).lean().exec();
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
        .limit(limit)
        .lean()
        .exec();

      related.push(...categoryMatched);
    }

    if (related.length < limit && currentProduct.gender) {
      const existingIds = related.map((p) => p._id);

      const genderMatched = await Product.find({
        _id: {
          $nin: [excludeId, ...existingIds],
        },
        status: "Active",
        gender: currentProduct.gender,
      })
        .sort({ createdAt: -1 })
        .limit(limit - related.length)
        .lean()
        .exec();

      related.push(...genderMatched);
    }

    return related.slice(0, limit);
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

    const product = await Product.create({
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      stock: data.stock,
      status: data.status ?? "Active",
      image: mainImageUrl ?? data.image,
      images: galleryUrls ?? [],
      gender: data.gender,
      colors: data.colors,
      sizes: data.sizes,
      categoryId: data.categoryId,
    });

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

    return Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();
  },

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Product.findByIdAndDelete(id).lean().exec();
  },
};