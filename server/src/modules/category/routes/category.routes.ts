import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const categoryRouter = Router();

// GET /categories
categoryRouter.get("/", getCategories);

// GET /categories/:id
categoryRouter.get("/:id", getCategoryById);

// POST /categories
categoryRouter.post("/", createCategory);

// PUT /categories/:id
categoryRouter.put("/:id", updateCategory);

// DELETE /categories/:id
categoryRouter.delete("/:id", deleteCategory);

export default categoryRouter;
