//modules/auth/product/types/product.types.ts
import { ProductStatus, Gender, Size } from "../../../models/Product.model";

export type CreateProductDto = {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  stock: number;
  status?: ProductStatus;
  image: string;
  images?: string[];
  gender: Gender;
  colors: string[];
  sizes: Size[];
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
