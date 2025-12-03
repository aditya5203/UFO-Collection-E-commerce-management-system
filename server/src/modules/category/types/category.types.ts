// DTOs (Data Transfer Objects) for Category module

export interface CreateCategoryDTO {
  name: string;
  // if not provided, we will generate from name in service
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive?: boolean;
}

export interface CategoryQueryDTO {
  // ?search=men etc.
  search?: string;
  // ?isActive=true/false
  isActive?: boolean;
}
