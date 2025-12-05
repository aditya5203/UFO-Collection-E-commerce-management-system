import { Category } from "../../../models/Category.model";
import { ICategory } from "../../../models/Category.model";

import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQueryDTO,
} from "../types/category.types";

class CategoryService {
  async createCategory(payload: CreateCategoryDTO): Promise<ICategory> {
    const slug =
      payload.slug ??
      payload.name.toLowerCase().trim().replace(/\s+/g, "-");

    const category = await Category.create({
      name: payload.name,
      slug,
      description: payload.description ?? "",
      imageUrl: payload.imageUrl ?? "",
      parent: payload.parentId ?? null,
      isActive: payload.isActive ?? true,

      // ✅ IMPORTANT
      mainCategory: payload.mainCategory,
      customer: payload.customer,
    });

    return category;
  }

  async getCategories(query: CategoryQueryDTO): Promise<ICategory[]> {
    const filter: any = {};

    // 🔍 TEXT SEARCH
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    // ✅ ACTIVE FILTER
    if (typeof query.isActive === "boolean") {
      filter.isActive = query.isActive;
    }

    // ✅ MAIN CATEGORY FILTER
    if (query.mainCategory) {
      filter.mainCategory = query.mainCategory;
    }

    // ✅ CUSTOMER FILTER
    if (query.customer) {
      filter.customer = query.customer;
    }

    return Category.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  async updateCategory(
    id: string,
    payload: UpdateCategoryDTO
  ): Promise<ICategory | null> {
    const updateData: any = {};

    if (payload.name) {
      updateData.name = payload.name;
      updateData.slug =
        payload.slug ??
        payload.name.toLowerCase().trim().replace(/\s+/g, "-");
    }

    if (payload.description !== undefined)
      updateData.description = payload.description;

    if (payload.imageUrl !== undefined)
      updateData.imageUrl = payload.imageUrl;

    if (payload.parentId !== undefined)
      updateData.parent = payload.parentId;

    if (payload.isActive !== undefined)
      updateData.isActive = payload.isActive;

    // ✅ NEW FIELDS
    if (payload.mainCategory !== undefined)
      updateData.mainCategory = payload.mainCategory;

    if (payload.customer !== undefined)
      updateData.customer = payload.customer;

    return Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await Category.findByIdAndDelete(id);
  }
}

export const categoryService = new CategoryService();
