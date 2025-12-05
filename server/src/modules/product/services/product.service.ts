import { Product, IProduct } from "../../../models/Product.model";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from "../types/product.types";

export const productService = {
  // For admin – can see all, with filters
  async getAllForAdmin(query: ProductQueryDto) {
    const filter: { [key: string]: any } = {};

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    if (query.category && query.category !== "All") {
      filter.category = query.category;
    }

    if (query.status && query.status !== "All") {
      filter.status = query.status;
    }

    // 🔹 optional filters (not used by UI yet, but ready)
    if (query.mainCategory) {
      filter.mainCategory = query.mainCategory;
    }
    if (query.subCategory) {
      filter.subCategory = query.subCategory;
    }
    if (query.customer) {
      filter.customer = query.customer;
    }

    return Product.find(filter).sort({ createdAt: -1 }).lean().exec();
  },

  // For public frontend – only Active products
  async getAllPublic(query: ProductQueryDto) {
    const filter: { [key: string]: any } = { status: "Active" };

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ name: regex }, { sku: regex }];
    }

    if (query.category) {
      filter.category = query.category;
    }

    // optional
    if (query.mainCategory) {
      filter.mainCategory = query.mainCategory;
    }
    if (query.subCategory) {
      filter.subCategory = query.subCategory;
    }
    if (query.customer) {
      filter.customer = query.customer;
    }

    return Product.find(filter).sort({ createdAt: -1 }).lean().exec();
  },

  async getById(id: string) {
    return Product.findById(id).lean().exec();
  },

  async create(data: CreateProductDto) {
    const product = await Product.create({
      sku: data.sku,
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      stock: data.stock,
      status: data.status ?? "Active",
      image: data.image,
      images: data.images ?? [],

      // 🔹 ensure these are stored
      mainCategory: data.mainCategory,
      subCategory: data.subCategory,
      customer: data.customer,
    });
    return product.toObject();
  },

  async update(id: string, data: UpdateProductDto) {
    return Product.findByIdAndUpdate(id, data, {
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
