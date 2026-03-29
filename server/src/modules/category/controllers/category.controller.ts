import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQueryDTO,
} from "../types/category.types";

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Public category endpoints
 *   - name: Categories - Admin
 *     description: Admin category management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "65f1b2c3d4e5f67890123456"
 *         name:
 *           type: string
 *           example: "T-Shirts"
 *         slug:
 *           type: string
 *           example: "t-shirts"
 *         description:
 *           type: string
 *           example: "All t-shirt products"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "T-Shirts"
 *         slug:
 *           type: string
 *           example: "t-shirts"
 *         description:
 *           type: string
 *           example: "All t-shirt products"
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Shirts"
 *         slug:
 *           type: string
 *           example: "shirts"
 *         description:
 *           type: string
 *           example: "Updated category description"
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Category'
 *
 *     CategoryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Category deleted successfully"
 */

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: List all categories for admin
 *     description: Returns all categories. Admin can filter by search and active status.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category by name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 */
export const getCategories = async (
  req: Request<{}, {}, {}, CategoryQueryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: CategoryQueryDTO = { ...req.query };

    const categories = await categoryService.getCategories(query);

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List active public categories
 *     description: Returns only active categories for public users.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search category by name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Public categories are active by default
 *     responses:
 *       200:
 *         description: Public categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 */
export const getPublicCategories = async (
  req: Request<{}, {}, {}, CategoryQueryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: CategoryQueryDTO = { ...req.query };

    if (typeof query.isActive !== "boolean") {
      query.isActive = true;
    }

    const categories = await categoryService.getCategories(query);

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/admin/categories:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: Create a new category
 *     description: Creates a category. Slug can be auto-generated from name if omitted in service layer.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         description: Name is required
 */
export const createCategory = async (
  req: Request<{}, {}, CreateCategoryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }

    const category = await categoryService.createCategory(req.body);

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: Get category by ID for admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       404:
 *         description: Category not found
 */
export const getCategoryById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get active public category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       404:
 *         description: Category not found
 */
export const getPublicCategoryById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category || category.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: Update category by ID
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
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       404:
 *         description: Category not found
 */
export const updateCategory = async (
  req: Request<{ id: string }, {}, UpdateCategoryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: Delete category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Category not found
 */
export const deleteCategory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};