// modules/auth/category/controllers/category.controller.ts
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
 *     description: Admin category management (CRUD from dashboard)
 */

/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: List categories
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of categories
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
 *     summary: Get all active categories (public)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of categories
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
 *     description: |
 *       Creates a category; slug will be auto-generated from name when omitted.
 *       Use different names to represent sub-categories as needed (e.g. "Sneakers", "Hoodies").
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created
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
 *     summary: Get category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
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
 *     summary: Get category by ID (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
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
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
export const updateCategory = async (
  req: Request<{ id: string }, {}, UpdateCategoryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);

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
 *       204:
 *         description: Category deleted
 */
export const deleteCategory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
