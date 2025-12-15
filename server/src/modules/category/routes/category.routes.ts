//modules/auth/category/routes/category.routes.ts
import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  getPublicCategories,
  getPublicCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import authMiddleware, {
  authorize,
} from "../../auth/middleware/auth.middleware";

const publicRouter = Router();
const adminRouter = Router();

// Public
publicRouter.get("/", getPublicCategories);
publicRouter.get("/:id", getPublicCategoryById);

// Admin
adminRouter.use(authMiddleware);
adminRouter.use(authorize("admin", "superadmin"));
adminRouter.get("/", getCategories);
adminRouter.post("/", createCategory);
adminRouter.get("/:id", getCategoryById);
adminRouter.put("/:id", updateCategory);
adminRouter.delete("/:id", deleteCategory);

export default {
  publicRouter,
  adminRouter,
};
