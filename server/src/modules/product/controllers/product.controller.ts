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
  compareAtPrice: p.compareAtPrice ?? null,
  discountPercent: Number(p.discountPercent || 0),

  stock: p.stock,
  status: p.status,
  image: p.image,
  images: p.images ?? [],
  gender: p.gender,
  colors: p.colors ?? [],
  sizes: p.sizes ?? [],
  variants: Array.isArray(p.variants)
    ? p.variants.map((variant: any) => ({
        id: variant._id?.toString?.() ?? variant.id,
        color: variant.color,
        size: variant.size,
        stock: Number(variant.stock || 0),
        sku: variant.sku || "",
        isActive: variant.isActive !== false,
      }))
    : [],
  categoryId: p.categoryId ?? null,

  rating: Number(p.avgRating || 0),
  reviews: Number(p.reviewCount || 0),
  avgRating: Number(p.avgRating || 0),
  reviewCount: Number(p.reviewCount || 0),

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
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "65f1c4b9e3b6f27c0d1a5555"
 *         color:
 *           type: string
 *           example: "#000000"
 *         size:
 *           type: string
 *           enum: [S, M, L, XL, XXL, 38, 39, 40, 41, 42, 43, 44, 45]
 *           example: "M"
 *         stock:
 *           type: number
 *           example: 10
 *         sku:
 *           type: string
 *           example: "UFO-HOOD-BLK-M"
 *         isActive:
 *           type: boolean
 *           example: true
 *
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
 *         compareAtPrice:
 *           type: number
 *           nullable: true
 *           example: 3999
 *         discountPercent:
 *           type: number
 *           example: 50
 *         stock:
 *           type: number
 *           description: Total stock calculated from active variants when variants exist
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
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *           example: "Male"
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [S, M, L, XL, XXL, 38, 39, 40, 41, 42, 43, 44, 45]
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *         categoryId:
 *           type: string
 *           nullable: true
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
 *         - image
 *         - gender
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
 *         compareAtPrice:
 *           type: number
 *           description: Actual/MRP price. Must be greater than price to show discount.
 *           example: 3999
 *         stock:
 *           type: number
 *           description: Used only when variants are not provided
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
 *         gender:
 *           type: string
 *           enum: [Male, Female]
 *           example: "Male"
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *         sizes:
 *           type: array
 *           items:
 *             type: string
 *             enum: [S, M, L, XL, XXL, 38, 39, 40, 41, 42, 43, 44, 45]
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
 *         categoryId:
 *           type: string
 *           example: "65f1c4b9e3b6f27c0d1a9999"
 *
 *     UpdateProductRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         compareAtPrice:
 *           type: number
 *           description: Actual/MRP price. Must be greater than price to show discount.
 *         stock:
 *           type: number
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *         image:
 *           type: string
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
 *             enum: [S, M, L, XL, XXL, 38, 39, 40, 41, 42, 43, 44, 45]
 *         variants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariant'
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
 *     summary: List products for admin
 *     description: Returns all products for admin with variants, discount fields, average rating, and review count.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *           enum: [S, M, L, XL, XXL, 38, 39, 40, 41, 42, 43, 44, 45]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product list fetched successfully
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
 *     summary: List active public products
 *     description: Returns active public products with discount fields, variants, average rating, and review count.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female]
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *           enum: [S, M, L, XL, XXL, 38, 39, 40, 41, 42, 43, 44, 45]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active product list fetched successfully
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
 *     summary: List best-selling active products
 *     description: Returns active products ranked by total sold quantity from delivered orders.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 8
 *     responses:
 *       200:
 *         description: Best-selling products fetched successfully
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
 *     summary: Get active product by ID
 *     description: Public users can fetch only active products.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       404:
 *         description: Product not found
 *
 * /api/admin/products/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Products - Admin]
 *     summary: Get product by ID for admin
 *     description: Admin can fetch active or inactive products.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
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
 *     summary: Get related active products
 *     description: Returns up to 4 related active products by category or gender.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Related products fetched successfully
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
 *     summary: Create product
 *     description: Creates a product with simple stock or variant stock. Supports compareAtPrice and discountPercent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *           examples:
 *             variantProduct:
 *               summary: Product with variant stock and discount
 *               value:
 *                 name: "UFO Oversized Hoodie"
 *                 description: "Premium oversized hoodie"
 *                 price: 2999
 *                 compareAtPrice: 4999
 *                 status: "Active"
 *                 image: "https://example.com/hoodie.jpg"
 *                 images: ["https://example.com/hoodie-1.jpg"]
 *                 gender: "Male"
 *                 categoryId: "65f1c4b9e3b6f27c0d1a1234"
 *                 variants:
 *                   - color: "#000000"
 *                     size: "M"
 *                     stock: 10
 *                     sku: "UFO-HOOD-BLK-M"
 *                     isActive: true
 *                   - color: "#000000"
 *                     size: "L"
 *                     stock: 5
 *                     sku: "UFO-HOOD-BLK-L"
 *                     isActive: true
 *             shoeProduct:
 *               summary: Shoe product with number sizes
 *               value:
 *                 name: "UFO Street Sneakers"
 *                 description: "Comfortable daily sneakers"
 *                 price: 3499
 *                 compareAtPrice: 4999
 *                 stock: 30
 *                 status: "Active"
 *                 image: "https://example.com/shoe.jpg"
 *                 gender: "Male"
 *                 colors: ["#000000", "#ffffff"]
 *                 sizes: ["40", "41", "42", "43"]
 *                 categoryId: "65f1c4b9e3b6f27c0d1a1234"
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateProductDto = req.body;

    const hasVariants = Array.isArray(body.variants) && body.variants.length > 0;

    if (
      !body.name ||
      body.price == null ||
      !body.image ||
      !body.gender ||
      !body.categoryId
    ) {
      throw new AppError(
        "name, price, image, gender, categoryId are required",
        400
      );
    }

    if (
      body.compareAtPrice != null &&
      Number(body.compareAtPrice) > 0 &&
      Number(body.compareAtPrice) <= Number(body.price)
    ) {
      throw new AppError(
        "compareAtPrice must be greater than price when provided",
        400
      );
    }

    if (!hasVariants) {
      if (
        body.stock == null ||
        !body.colors ||
        !Array.isArray(body.colors) ||
        body.colors.length === 0 ||
        !body.sizes ||
        !Array.isArray(body.sizes) ||
        body.sizes.length === 0
      ) {
        throw new AppError(
          "Either variants are required, or stock, colors, and sizes are required",
          400
        );
      }
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
 *     description: Updates product details. If variants are provided, total stock, colors, and sizes are recalculated from variants.
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
 *             updatePriceDiscount:
 *               summary: Update price and MRP
 *               value:
 *                 price: 2499
 *                 compareAtPrice: 3999
 *             updateVariantStock:
 *               summary: Update variant stock
 *               value:
 *                 variants:
 *                   - color: "#000000"
 *                     size: "M"
 *                     stock: 12
 *                     sku: "UFO-HOOD-BLK-M"
 *                     isActive: true
 *                   - color: "#000000"
 *                     size: "L"
 *                     stock: 0
 *                     sku: "UFO-HOOD-BLK-L"
 *                     isActive: true
 *             changeStatus:
 *               summary: Change product status
 *               value:
 *                 status: "Inactive"
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: UpdateProductDto = req.body;

    if (
      body.compareAtPrice != null &&
      body.price != null &&
      Number(body.compareAtPrice) > 0 &&
      Number(body.compareAtPrice) <= Number(body.price)
    ) {
      throw new AppError(
        "compareAtPrice must be greater than price when provided",
        400
      );
    }

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
 *     description: Deletes product by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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