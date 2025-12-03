import { Request, Response, NextFunction } from "express";
import { categoryService } from "../services/category.service";
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryQueryDTO,
} from "../types/category.types";

// POST /categories
export const createCategory = async (
  req: Request<{}, {}, CreateCategoryDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await categoryService.createCategory(req.body);

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /categories
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

// GET /categories/:id
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

// PUT /categories/:id
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

// DELETE /categories/:id
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
