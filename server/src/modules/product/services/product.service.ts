//modules/auth/product/services/product.service.ts
import { Product } from "../../../models/Product.model";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from "../types/product.types";
import { generateProductSlug } from "../utils/slug.util";
import cloudinary from "../../../config/cloudinary";

export const productService = {
  // For admin – can see all, with filters
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

  // For public frontend – only Active products
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
    return Product.findById(id).lean().exec();
  },

  async create(data: CreateProductDto) {
    const slug = data.slug ?? generateProductSlug(data.name);

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
    const update: any = { ...data };
    if (data.name && !data.slug) {
      update.slug = generateProductSlug(data.name);
    }

    return Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .lean()
      .exec();
  },

  async remove(id: string) {
    return Product.findByIdAndDelete(id).lean().exec();
  },
};
