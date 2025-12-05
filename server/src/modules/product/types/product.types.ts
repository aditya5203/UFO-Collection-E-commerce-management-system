import { ProductStatus } from "../../../models/Product.model";
import type { MainCategory, CustomerType } from "../../../models/Category.model";

export type CreateProductDto = {
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  status?: ProductStatus;
  image: string;
  images?: string[];

  // Category metadata
  mainCategory: MainCategory;  // Clothes / Shoes
  subCategory: string;         // T-Shirt, Hoodie, etc.
  customer: CustomerType;      // Men / Women / Boys / Girls
};

export type UpdateProductDto = Partial<CreateProductDto>;

export type ProductQueryDto = {
  search?: string;
  category?: string;
  status?: ProductStatus | "All";

  mainCategory?: MainCategory;
  subCategory?: string;
  customer?: CustomerType;
};
