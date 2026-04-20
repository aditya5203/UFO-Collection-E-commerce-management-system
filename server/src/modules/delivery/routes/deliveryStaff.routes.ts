import { Router } from "express";
import { deliveryStaffController } from "../controllers/deliveryStaff.controller";
import {
  adminAuthMiddleware,
  deliveryAuthMiddleware,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Delivery Staff
 *     description: Delivery rider self-service and admin delivery staff management APIs
 */

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

router.post("/", adminAuthMiddleware, deliveryStaffController.create);
router.get("/", adminAuthMiddleware, deliveryStaffController.list);
router.get("/:id", adminAuthMiddleware, deliveryStaffController.getById);
router.put("/:id", adminAuthMiddleware, deliveryStaffController.update);

export default router;