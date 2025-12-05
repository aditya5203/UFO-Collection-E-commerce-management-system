// DTOs (Data Transfer Objects) for Category module

// 🔹 local union types (keep in sync with model)
export type MainCategory = "Clothes" | "Shoes";
export type CustomerType = "Men" | "Women" | "Boys" | "Girls";

export interface CreateCategoryDTO {
  name: string;
  // if not provided, we will generate from name in service
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;

  // 🔹 NEW – required on create
  mainCategory: MainCategory;   // Clothes / Shoes
  customer: CustomerType;       // Men / Women / Boys / Girls
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;

  // 🔹 NEW – optional on update
  mainCategory?: MainCategory;
  customer?: CustomerType;
}

export interface CategoryQueryDTO {
  // ?search=men etc.
  search?: string;
  // ?isActive=true/false
  isActive?: boolean;

  // 🔹 OPTIONAL FILTERS (for future use)
  mainCategory?: MainCategory;
  customer?: CustomerType;
}
