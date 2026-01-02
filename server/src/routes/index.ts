// server/src/routes/index.ts
import { Router } from "express";

import authRoutes from "../modules/auth/routes/auth.routes";
import categoryRoutes from "../modules/category/routes/category.routes";
import productRoutes from "../modules/product/routes/product.routes";
import paymentRoutes from "../modules/payments/routes/payment.routes";
import orderRoutes from "../modules/orders/routes/order.routes";
import customerRoutes from "../modules/customers/routes/customer.routes";

// ✅ add this
import addressRoutes from "../modules/addresses/routes/address.routes";

import {
  adminAuthMiddleware,
  customerAuthMiddleware, // ✅ add this
} from "../modules/auth/middleware/auth.middleware";

const router = Router();

/* -------------------- PUBLIC ENDPOINTS -------------------- */
router.use("/payments", paymentRoutes);
router.use("/products", productRoutes.publicRouter);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes.publicRouter);

// ✅ Customer/checkout orders (public)
router.use("/orders", orderRoutes.publicRouter);

// ✅ Addresses for logged-in customers
router.use("/addresses", customerAuthMiddleware, addressRoutes);

/* -------------------- ADMIN ENDPOINTS (PROTECTED) -------------------- */
router.use("/admin/products", adminAuthMiddleware, productRoutes.adminRouter);
router.use("/admin/categories", adminAuthMiddleware, categoryRoutes.adminRouter);
router.use("/admin/orders", adminAuthMiddleware, orderRoutes.adminRouter);
router.use("/admin/customers", adminAuthMiddleware, customerRoutes.adminRouter);

export default router;
