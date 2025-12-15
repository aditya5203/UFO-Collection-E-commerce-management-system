import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes";
import categoryRoutes from "../modules/category/routes/category.routes";
import productRoutes from "../modules/product/routes/product.routes";

const router = Router();

/* -------------------- PUBLIC ENDPOINTS -------------------- */

// Public products → /api/products/...
router.use("/products", productRoutes.publicRouter);

// Auth → /api/auth/...
router.use("/auth", authRoutes);

/* -------------------- ADMIN ENDPOINTS -------------------- */

// Public categories → /api/categories/...
router.use("/categories", categoryRoutes.publicRouter);

// Admin products → /api/admin/products/...
router.use("/admin/products", productRoutes.adminRouter);

// Admin categories → /api/admin/categories/...
router.use("/admin/categories", categoryRoutes.adminRouter);

export default router;
