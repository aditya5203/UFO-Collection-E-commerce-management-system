// server/src/modules/notifications/routes/notification.routes.ts
import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { customerAuthMiddleware } from "../../auth/middleware/auth.middleware";

const router = Router();

// ✅ Customer notifications should ONLY use customer token
router.use(customerAuthMiddleware);

// GET /api/notifications?limit=50
router.get("/", notificationController.list);

// GET /api/notifications/unread-count
router.get("/unread-count", notificationController.unreadCount);

// PATCH /api/notifications/read-all
router.patch("/read-all", notificationController.markAllRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", notificationController.markRead);

export default router;
