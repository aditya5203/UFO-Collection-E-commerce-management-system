//modules/auth/category/routes/category.routes.ts
import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import authMiddleware, {
  authorize,
} from "../../auth/middleware/auth.middleware";

const publicRouter = Router();
const adminRouter = Router();

/* ---------------------------------------------------
 * Public routes (for frontend dropdowns / filters)
 * Base path: /api/categories
 * --------------------------------------------------*/

// GET /api/categories
publicRouter.get("/", getCategories);

// GET /api/categories/:id
publicRouter.get("/:id", getCategoryById);

/* ---------------------------------------------------
 * Admin routes (dashboard CRUD)
 * Base path: /api/admin/categories
 * Protected by auth + role
 * --------------------------------------------------*/

adminRouter.use(authMiddleware);
adminRouter.use(authorize("admin", "superadmin"));

// GET /api/admin/categories  (admin listing – reuse same handler)
adminRouter.get("/", getCategories);

// POST /api/admin/categories
adminRouter.post("/", createCategory);

// GET /api/admin/categories/:id
adminRouter.get("/:id", getCategoryById);

// PUT /api/admin/categories/:id
adminRouter.put("/:id", updateCategory);

// DELETE /api/admin/categories/:id
adminRouter.delete("/:id", deleteCategory);

export default {
  publicRouter,
  adminRouter,
};
