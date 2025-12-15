//modules/auth/category/services/category.service.ts
import { Category, ICategory } from "../../../models/Category.model";
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQueryDTO,
} from "../types/category.types";
import { generateCategorySlug } from "../utils/slug.util";

class CategoryService {
  async createCategory(payload: CreateCategoryDTO): Promise<ICategory> {
    const slug = payload.slug ?? generateCategorySlug(payload.name);

    // ✅ prevent duplicate per slug
    const exists = await Category.findOne({
      slug,
    }).lean();

    if (exists) {
      const err: any = new Error(
        `Category '${payload.name}' already exists`
      );
      err.statusCode = 400;
      throw err;
    }

    const category = await Category.create({
      name: payload.name,
      slug,
      description: payload.description ?? "",
      imageUrl: payload.imageUrl ?? "",
      isActive: payload.isActive ?? true,
    });

    return category;
  }

  async getCategories(query: CategoryQueryDTO): Promise<ICategory[]> {
    const filter: any = {};

    // 🔍 search
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    if (typeof query.isActive === "boolean") {
      filter.isActive = query.isActive;
    }

    return Category.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  async updateCategory(id: string, payload: UpdateCategoryDTO): Promise<ICategory | null> {
    const updateData: any = {};

    if (payload.name) {
      updateData.name = payload.name;
      updateData.slug = payload.slug ?? generateCategorySlug(payload.name);
    }

    if (payload.slug !== undefined) updateData.slug = payload.slug;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.imageUrl !== undefined) updateData.imageUrl = payload.imageUrl;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

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
