// server/src/modules/notification/routes/notification.routes.ts
import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

// GET /api/notifications?limit=50
router.get("/", notificationController.list);

// GET /api/notifications/unread-count
router.get("/unread-count", notificationController.unreadCount);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", notificationController.markRead);

// PATCH /api/notifications/read-all
router.patch("/read-all", notificationController.markAllRead);

export default router;
