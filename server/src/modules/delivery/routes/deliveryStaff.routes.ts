import { Router } from "express";
import { deliveryStaffController } from "../controllers/deliveryStaff.controller";
import {
  adminAuthMiddleware,
  deliveryAuthMiddleware,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const router = Router();

/* DELIVERY STAFF SELF ROUTES */
router.get(
  "/me/dashboard",
  deliveryAuthMiddleware,
  deliveryStaffController.dashboard
);

router.get(
  "/me/orders",
  deliveryAuthMiddleware,
  deliveryStaffController.myOrders
);

router.get(
  "/me/orders/:id",
  deliveryAuthMiddleware,
  deliveryStaffController.myOrderDetails
);

router.patch(
  "/me/orders/:id/status",
  deliveryAuthMiddleware,
  deliveryStaffController.updateMyOrderStatus
);

router.post(
  "/me/orders/:id/send-otp",
  deliveryAuthMiddleware,
  deliveryStaffController.sendMyOrderOtp
);

router.post(
  "/me/orders/:id/verify-otp",
  deliveryAuthMiddleware,
  deliveryStaffController.verifyMyOrderOtp
);

/* ADMIN DELIVERY STAFF MANAGEMENT ROUTES */
router.post(
  "/invite",
  adminAuthMiddleware,
  authorizePermission("deliveryStaffCreate"),
  deliveryStaffController.create
);

router.get(
  "/",
  adminAuthMiddleware,
  authorizePermission("deliveryStaffView"),
  deliveryStaffController.list
);

router.get(
  "/:id",
  adminAuthMiddleware,
  authorizePermission("deliveryStaffView"),
  deliveryStaffController.getById
);

router.put(
  "/:id",
  adminAuthMiddleware,
  authorizePermission("deliveryStaffEdit"),
  deliveryStaffController.update
);

router.delete(
  "/:id",
  adminAuthMiddleware,
  authorizePermission("deliveryStaffDelete"),
  deliveryStaffController.remove
);

export default router;