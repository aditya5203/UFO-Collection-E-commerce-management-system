import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import {
  customerAuthMiddleware,
  adminAuthMiddleware,
  deliveryAuthMiddleware,
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
router.post(
  "/admin/broadcast",
  adminAuthMiddleware,
  notificationController.adminBroadcast
);
router.get(
  "/admin/broadcast-history",
  adminAuthMiddleware,
  notificationController.adminBroadcastHistory
);

/* DELIVERY */
router.get(
  "/delivery",
  deliveryAuthMiddleware,
  notificationController.listDelivery
);
router.get(
  "/delivery/unread-count",
  deliveryAuthMiddleware,
  notificationController.deliveryUnreadCount
);
router.patch(
  "/delivery/read-all",
  deliveryAuthMiddleware,
  notificationController.deliveryMarkAllRead
);
router.patch(
  "/delivery/:id/read",
  deliveryAuthMiddleware,
  notificationController.deliveryMarkRead
);

export default router;