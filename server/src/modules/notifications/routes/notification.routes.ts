import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import {
  customerAuthMiddleware,
  adminAuthMiddleware,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/* CUSTOMER */
router.get("/", customerAuthMiddleware, notificationController.list);
router.get(
  "/unread-count",
  customerAuthMiddleware,
  notificationController.unreadCount
);
router.patch(
  "/read-all",
  customerAuthMiddleware,
  notificationController.markAllRead
);
router.patch(
  "/:id/read",
  customerAuthMiddleware,
  notificationController.markRead
);

/* ADMIN */
router.get("/admin", adminAuthMiddleware, notificationController.listAdmin);
router.get(
  "/admin/unread-count",
  adminAuthMiddleware,
  notificationController.adminUnreadCount
);
router.patch(
  "/admin/read-all",
  adminAuthMiddleware,
  notificationController.adminMarkAllRead
);
router.patch(
  "/admin/:id/read",
  adminAuthMiddleware,
  notificationController.adminMarkRead
);

export default router;