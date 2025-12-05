import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from "../types/product.types";
import { AppError } from "../../../middleware/error.middleware";

const mapToFrontend = (p: any) => ({
  id: p._id?.toString?.() ?? p.id,
  sku: p.sku,
  name: p.name,
  description: p.description,
  category: p.category,
  price: p.price,
  stock: p.stock,
  status: p.status,
  image: p.image,

  // 🔹 new fields will also be available in JSON response
  mainCategory: p.mainCategory,
  subCategory: p.subCategory,
  customer: p.customer,
});

/**
 * GET /api/admin/products
 */
const getAllForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await productService.getAllForAdmin({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      status: (req.query.status as any) ?? "All",
      mainCategory: req.query.mainCategory as any,
      subCategory: req.query.subCategory as string | undefined,
      customer: req.query.customer as any,
    });

    res.json(products.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products
 */
const getAllPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await productService.getAllPublic({
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      mainCategory: req.query.mainCategory as any,
      subCategory: req.query.subCategory as string | undefined,
      customer: req.query.customer as any,
    });

    res.json(products.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id  &  /api/admin/products/:id
 */
const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getById(req.params.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.json(mapToFrontend(product));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/products
 */
const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateProductDto = req.body;

    if (
      !body.sku ||
      !body.name ||
      !body.category ||
      body.price == null ||
      !body.image ||
      !body.mainCategory ||
      !body.subCategory ||
      !body.customer
    ) {
      throw new AppError(
        "sku, name, category, price, image, mainCategory, subCategory and customer are required",
        400
      );
    }

    const product = await productService.create(body);

    res.status(201).json(mapToFrontend(product));
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/products/:id
 */
const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: UpdateProductDto = req.body;

    const product = await productService.update(req.params.id, body);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.json(mapToFrontend(product));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/products/:id
 */
const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.remove(req.params.id);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const productController = {
  getAllForAdmin,
  getAllPublic,
  getById,
  create,
  update,
  remove,
};
