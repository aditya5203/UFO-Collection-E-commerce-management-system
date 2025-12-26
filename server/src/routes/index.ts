//server/src/routes/index.ts
import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes";
import categoryRoutes from "../modules/category/routes/category.routes";
import productRoutes from "../modules/product/routes/product.routes";
import paymentRoutes from "../modules/payments/routes/payment.routes";

const router = Router();

/* -------------------- PUBLIC ENDPOINTS -------------------- */

// Payments → /api/payments/...
router.use("/payments", paymentRoutes);

// Public products → /api/products/...
router.use("/products", productRoutes.publicRouter);

// Auth → /api/auth/...
router.use("/auth", authRoutes);

// Public categories → /api/categories/...
router.use("/categories", categoryRoutes.publicRouter);

/* -------------------- ADMIN ENDPOINTS -------------------- */

// Admin products → /api/admin/products/...
router.use("/admin/products", productRoutes.adminRouter);

// Admin categories → /api/admin/categories/...
router.use("/admin/categories", categoryRoutes.adminRouter);

export default router;
