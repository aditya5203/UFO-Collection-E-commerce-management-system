// server/src/routes/index.ts

import { Router } from "express";

import authRoutes from "../modules/auth/routes/auth.routes";
import categoryRoutes from "../modules/category/routes/category.routes";
import productRoutes from "../modules/product/routes/product.routes";
import paymentRoutes from "../modules/payments/routes/payment.routes";
import orderRoutes from "../modules/orders/routes/order.routes";
import customerRoutes from "../modules/customers/routes/customer.routes";
import addressRoutes from "../modules/addresses/routes/address.routes";

// ✅ Dashboard (Admin)
import dashboardRoutes from "../modules/admin/routes/dashboard.routes";

// ✅ Reviews
import reviewRoutes from "../modules/reviews/routes/reviews.routes";
import adminReviewsRoutes from "../modules/reviews/routes/admin.reviews.routes";

// ✅ Chat
import chatRoutes from "../modules/chat/routes/chat.routes";
import adminChatRoutes from "../modules/chat/routes/admin.chat.routes";

// ✅ Tickets
import ticketRoutes from "../modules/tickets/routes/ticket.routes";
import adminTicketRoutes from "../modules/tickets/routes/admin.ticket.routes";
import customerTicketRoutes from "../modules/tickets/routes/customer.ticket.routes";

// ✅ Ads
import adsRoutes from "../modules/ads/routes/ads.routes";

// ✅ Discounts
import discountRoutes from "../modules/discounts/routes/discount.routes";

import {
  adminAuthMiddleware,
  customerAuthMiddleware,
} from "../modules/auth/middleware/auth.middleware";

const router = Router();

/* -------------------- PUBLIC ENDPOINTS -------------------- */
router.use("/payments", paymentRoutes);

// ✅ Products public + reviews under same /products base
router.use("/products", productRoutes.publicRouter);
router.use("/products", reviewRoutes);

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes.publicRouter);
router.use("/orders", orderRoutes.publicRouter);

// ✅ PUBLIC ADS
router.use("/ads", adsRoutes.publicRouter);

// ✅ tickets (public create)
router.use("/tickets", ticketRoutes);

// ✅ ✅ PUBLIC DISCOUNTS (for homepage + discounts list)
router.use("/discounts", discountRoutes.publicRouter);

/* -------------------- CUSTOMER (PROTECTED) -------------------- */
router.use("/addresses", customerAuthMiddleware, addressRoutes);
router.use("/chat", customerAuthMiddleware, chatRoutes);
router.use("/tickets", customerAuthMiddleware, customerTicketRoutes);

// ✅ CUSTOMER DISCOUNTS (collect / my-collected / validate / collect-all)
router.use("/discounts", customerAuthMiddleware, discountRoutes.customerRouter);

/* -------------------- ADMIN (PROTECTED) -------------------- */
router.use("/admin/products", adminAuthMiddleware, productRoutes.adminRouter);
router.use("/admin/categories", adminAuthMiddleware, categoryRoutes.adminRouter);
router.use("/admin/orders", adminAuthMiddleware, orderRoutes.adminRouter);
router.use("/admin/customers", adminAuthMiddleware, customerRoutes.adminRouter);

router.use("/admin/chat", adminAuthMiddleware, adminChatRoutes);
router.use("/admin/reviews", adminAuthMiddleware, adminReviewsRoutes);
router.use("/admin/tickets", adminAuthMiddleware, adminTicketRoutes);
router.use("/admin/ads", adminAuthMiddleware, adsRoutes.adminRouter);

// ✅ ADMIN DISCOUNTS (CRUD + collected list)
router.use("/admin/discounts", adminAuthMiddleware, discountRoutes.adminRouter);

// ✅ ADMIN DASHBOARD
router.use("/admin/dashboard", adminAuthMiddleware, dashboardRoutes);

export default router;
