//modules/auth/category/controllers/category.controller.ts
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
 *     description: Public category endpoints (for dropdowns, filters, etc.)
 *   - name: Categories - Admin
 *     description: Admin category management (CRUD from dashboard)
 */

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
 *       - in: query
 *         name: mainCategory
 *         schema:
 *           type: string
 *           enum: [Clothes, Shoes]
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *           enum: [Men, Women, Boys, Girls]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
export const getCategories = async (
  req: Request<{}, {}, {}, CategoryQueryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await categoryService.getCategories(req.query);

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
 *     summary: Create a new category (sub-category)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 */
export const createCategory = async (
  req: Request<{}, {}, CreateCategoryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, mainCategory, customer } = req.body;

    if (!name || !mainCategory || !customer) {
      return res.status(400).json({
        success: false,
        message: "name, mainCategory and customer are required",
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
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a single category by ID (public)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *
 * /api/admin/categories/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: Get a single category by ID (admin)
 *     parameters:
 *       - name: id
 *         in: path
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
 * /api/admin/categories/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     tags: [Categories - Admin]
 *     summary: Update an existing category
 *     parameters:
 *       - name: id
 *         in: path
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
 *     summary: Delete a category
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted
 *       404:
 *         description: Category not found
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
