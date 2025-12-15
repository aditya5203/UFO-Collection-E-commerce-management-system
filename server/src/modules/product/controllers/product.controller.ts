//modules/auth/product/controllers/product.controller.ts
import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import {
  CreateProductDto,
  UpdateProductDto,
} from "../types/product.types";
import { AppError } from "../../../middleware/error.middleware";

const mapToFrontend = (p: any) => ({
  id: p._id?.toString?.() ?? p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  price: p.price,
  stock: p.stock,
  status: p.status,
  image: p.image,
  images: p.images ?? [],
  gender: p.gender,
  colors: p.colors ?? [],
  sizes: p.sizes ?? [],
  categoryId: p.categoryId ?? null,
});

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Public product catalog
 *   - name: Products - Admin
 *     description: Admin product management
 */

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: List products (admin)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or slug
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, All]
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female]
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [S, M, L, XL, XXL]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
const getAllForAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productService.getAllForAdmin({
      search: req.query.search as string | undefined,
      status: (req.query.status as any) ?? "All",
      gender: req.query.gender as any,
      size: req.query.size as any,
      categoryId: req.query.categoryId as string | undefined,
    });

    res.json(products.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products (public, Active only)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or slug
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female]
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [S, M, L, XL, XXL]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active products
 */
const getAllPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productService.getAllPublic({
      search: req.query.search as string | undefined,
      gender: req.query.gender as any,
      size: req.query.size as any,
      categoryId: req.query.categoryId as string | undefined,
    });

    res.json(products.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 * /api/admin/products/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: Get product by ID (admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product found
 *       404:
 *         description: Product not found
 */
const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getById(req.params.id);

    if (!product) throw new AppError("Product not found", 404);

    res.json(mapToFrontend(product));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *           examples:
 *             default:
 *               summary: Basic product
 *               value:
 *                 name: "Minimal Tee"
 *                 description: "Soft cotton tee"
 *                 price: 1999
 *                 stock: 50
 *                 status: "Active"
 *                 image: "https://example.com/main.jpg"
 *                 images: ["https://example.com/a.jpg", "https://example.com/b.jpg"]
 *                 gender: "Male"
 *                 colors: ["#000000", "#ffffff"]
 *                 sizes: ["M", "L", "XL"]
 *                 categoryId: "65f1c4b9e3b6f27c0d1a1234"
 *     responses:
 *       201:
 *         description: Product created
 */
const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateProductDto = req.body;

    if (
      !body.name ||
      body.price == null ||
      body.stock == null ||
      !body.image ||
      !body.gender ||
      !body.colors ||
      !Array.isArray(body.colors) ||
      body.colors.length === 0 ||
      !body.sizes ||
      !Array.isArray(body.sizes) ||
      body.sizes.length === 0 ||
      !body.categoryId
    ) {
      throw new AppError(
        "name, price, stock, image, gender, colors, sizes, categoryId are required",
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
 * @swagger
 * /api/admin/products/{id}:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: Update product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *           examples:
 *             changeStatus:
 *               summary: Change status and stock
 *               value:
 *                 status: "Inactive"
 *                 stock: 0
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: UpdateProductDto = req.body;

    const product = await productService.update(req.params.id, body);

    if (!product) throw new AppError("Product not found", 404);

    res.json(mapToFrontend(product));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: Delete product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.remove(req.params.id);

    if (!product) throw new AppError("Product not found", 404);

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
