// server/src/modules/category/routes/category.routes.ts
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
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const publicRouter = Router();
const adminRouter = Router();

// Public
publicRouter.get("/", getPublicCategories);
publicRouter.get("/:id", getPublicCategoryById);

// Admin
adminRouter.use(adminAuthMiddleware);
adminRouter.use(authorize("admin", "superadmin"));

adminRouter.get("/", authorizePermission("categoryView"), getCategories);
adminRouter.post("/", authorizePermission("categoryCreate"), createCategory);
adminRouter.get("/:id", authorizePermission("categoryView"), getCategoryById);
adminRouter.put("/:id", authorizePermission("categoryEdit"), updateCategory);
adminRouter.delete("/:id", authorizePermission("categoryDelete"), deleteCategory);

export default {
  publicRouter,
  adminRouter,
};