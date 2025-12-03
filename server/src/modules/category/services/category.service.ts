import { Category, ICategory } from "../../../models";
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQueryDTO,
} from "../types/category.types";

class CategoryService {
  async createCategory(payload: CreateCategoryDTO): Promise<ICategory> {
    // generate slug from name if not provided
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
    });

    return category;
  }

  async getCategories(query: CategoryQueryDTO): Promise<ICategory[]> {
    const filter: any = {};

    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    if (typeof query.isActive === "boolean") {
      filter.isActive = query.isActive;
    }

    return Category.find(filter).sort({ createdAt: -1 });
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

    return Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await Category.findByIdAndDelete(id);
  }
}

export const categoryService = new CategoryService();
