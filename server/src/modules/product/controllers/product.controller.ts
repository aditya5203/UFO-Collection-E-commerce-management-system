import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { CreateProductDto, UpdateProductDto } from "../types/product.types";
import { AppError } from "../../../middleware/error.middleware";
import { Review } from "../../../models/Review.model";

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

  // Real review data
  rating: Number(p.avgRating || 0),
  reviews: Number(p.reviewCount || 0),
  avgRating: Number(p.avgRating || 0),
  reviewCount: Number(p.reviewCount || 0),

  // Real best-seller data from delivered orders
  soldCount: Number(p.soldCount || 0),
});

async function attachReviewSummary(products: any[]) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const ids = products.map((p: any) => p?._id).filter(Boolean);
  if (ids.length === 0) return products;

  const summaries = await Review.aggregate([
    {
      $match: {
        product: { $in: ids },
      },
    },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const summaryMap = new Map(
    summaries.map((s: any) => [
      String(s._id),
      {
        avgRating: Number(Number(s.avgRating || 0).toFixed(1)),
        reviewCount: Number(s.reviewCount || 0),
      },
    ])
  );

  return products.map((p: any) => {
    const summary = summaryMap.get(String(p._id)) || {
      avgRating: 0,
      reviewCount: 0,
    };

    return {
      ...p,
      avgRating: summary.avgRating,
      reviewCount: summary.reviewCount,
    };
  });
}

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
 * components:
 *   schemas:
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "65f1c4b9e3b6f27c0d1a1234"
 *         name:
 *           type: string
 *           example: "Minimal Tee"
 *         slug:
 *           type: string
 *           example: "minimal-tee"
 *         description:
 *           type: string
 *           example: "Soft cotton tee"
 *         price:
 *           type: number
 *           example: 1999
 *         stock:
 *           type: number
 *           example: 50
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           example: "Active"
 *         image:
 *           type: string
 *           example: "https://example.com/main.jpg"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://example.com/a.jpg", "https://example.com/b.jpg"]
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *           example: "Male"
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["#000000", "#ffffff"]
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [S, M, L, XL, XXL]
 *           example: ["M", "L", "XL"]
 *         categoryId:
 *           type: string
 *           nullable: true
 *           example: "65f1c4b9e3b6f27c0d1a9999"
 *         rating:
 *           type: number
 *           example: 4.5
 *         reviews:
 *           type: number
 *           example: 12
 *         avgRating:
 *           type: number
 *           example: 4.5
 *         reviewCount:
 *           type: number
 *           example: 12
 *         soldCount:
 *           type: number
 *           example: 38
 *
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *         - image
 *         - gender
 *         - colors
 *         - sizes
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           example: "Minimal Tee"
 *         slug:
 *           type: string
 *           example: "minimal-tee"
 *         description:
 *           type: string
 *           example: "Soft cotton tee"
 *         price:
 *           type: number
 *           example: 1999
 *         stock:
 *           type: number
 *           example: 50
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           example: "Active"
 *         image:
 *           type: string
 *           example: "https://example.com/main.jpg"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["https://example.com/a.jpg", "https://example.com/b.jpg"]
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *           example: "Male"
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["#000000", "#ffffff"]
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [S, M, L, XL, XXL]
 *           example: ["M", "L", "XL"]
 *         categoryId:
 *           type: string
 *           example: "65f1c4b9e3b6f27c0d1a9999"
 *
 *     UpdateProductRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Updated Tee"
 *         slug:
 *           type: string
 *           example: "updated-tee"
 *         description:
 *           type: string
 *           example: "Updated description"
 *         price:
 *           type: number
 *           example: 2499
 *         stock:
 *           type: number
 *           example: 25
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           example: "Active"
 *         image:
 *           type: string
 *           example: "https://example.com/main-updated.jpg"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [S, M, L, XL, XXL]
 *         categoryId:
 *           type: string
 */

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: List products with real review summary
 *     description: Returns all products for admin with average rating and review count.
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
 *         description: Product list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductResponse'
 */
const getAllForAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await productService.getAllForAdmin({
      search: req.query.search as string | undefined,
      status: (req.query.status as any) ?? "All",
      gender: req.query.gender as any,
      size: req.query.size as any,
      categoryId: req.query.categoryId as string | undefined,
    });

    const productsWithReviews = await attachReviewSummary(products);

    res.json(productsWithReviews.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List active products with real review summary
 *     description: Returns only active public products with average rating and review count.
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
 *         description: Active product list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductResponse'
 */
const getAllPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await productService.getAllPublic({
      search: req.query.search as string | undefined,
      gender: req.query.gender as any,
      size: req.query.size as any,
      categoryId: req.query.categoryId as string | undefined,
    });

    const productsWithReviews = await attachReviewSummary(products);

    res.json(productsWithReviews.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/best-sellers:
 *   get:
 *     tags: [Products]
 *     summary: List real best-selling active products
 *     description: Returns active products ranked by total sold quantity from orders marked as Delivered. Pending, cancelled, confirmed, shipped, and transit orders are not counted.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 8
 *         description: Number of best-selling products to return.
 *     responses:
 *       200:
 *         description: Best-selling products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/ProductResponse'
 *                   - type: object
 *                     properties:
 *                       soldCount:
 *                         type: number
 *                         example: 38
 */
const getBestSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 24);

    const products = await productService.getBestSellers(limit);

    const productsWithReviews = await attachReviewSummary(products);

    res.json(productsWithReviews.map(mapToFrontend));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get active product by ID with real review summary
 *     description: Returns one active public product. Inactive products are hidden from public users.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       404:
 *         description: Product not found
 *
 * /api/admin/products/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: Get product by ID with real review summary
 *     description: Admin can fetch active or inactive product by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       404:
 *         description: Product not found
 */
const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdminRoute = req.originalUrl.includes("/api/admin/products");

    const product = isAdminRoute
      ? await productService.getById(req.params.id)
      : await productService.getPublicById(req.params.id);

    if (!product) throw new AppError("Product not found", 404);

    const [productWithReviews] = await attachReviewSummary([product]);

    res.json(mapToFrontend(productWithReviews));
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/products/{id}/related:
 *   get:
 *     tags: [Products]
 *     summary: Get related active products with review summary
 *     description: Returns up to 4 active related products. First matches by categoryId, then falls back to gender. Excludes the current product.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Related products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductResponse'
 */
const getRelated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relatedProducts = await productService.getRelatedProducts(
      req.params.id,
      4
    );

    const productsWithReviews = await attachReviewSummary(relatedProducts);

    res.json({
      data: productsWithReviews.map(mapToFrontend),
    });
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
 *     description: Creates a product. Required fields include name, price, stock, image, gender, colors, sizes, and categoryId.
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
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       400:
 *         description: Validation error
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
 *     description: Updates product details and returns the product with current review summary.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
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
 *             updatePrice:
 *               summary: Update price
 *               value:
 *                 price: 2499
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       404:
 *         description: Product not found
 */
const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: UpdateProductDto = req.body;

    const product = await productService.update(req.params.id, body);

    if (!product) throw new AppError("Product not found", 404);

    const [productWithReviews] = await attachReviewSummary([product]);

    res.json(mapToFrontend(productWithReviews));
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
 *     description: Deletes a product by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
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
  getBestSellers,
  getById,
  getRelated,
  create,
  update,
  remove,
};