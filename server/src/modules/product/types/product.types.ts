import { ProductStatus, Gender, Size } from "../../../models/Product.model";

export type ProductVariantDto = {
  _id?: string;
  id?: string;
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive?: boolean;
};

export type CreateProductDto = {
  name: string;
  slug?: string;
  description?: string;
  price: number;

  // Old/simple stock system. Kept optional for backward compatibility.
  stock?: number;
  colors?: string[];
  sizes?: Size[];

  // New size-wise and color-wise stock system.
  variants?: ProductVariantDto[];

  status?: ProductStatus;
  image: string;
  images?: string[];
  gender: Gender;
  categoryId: string;
};

export type UpdateProductDto = Partial<CreateProductDto>;

export type ProductQueryDto = {
  search?: string;
  status?: ProductStatus | "All";
  gender?: Gender;
  size?: Size;
  categoryId?: string;
};