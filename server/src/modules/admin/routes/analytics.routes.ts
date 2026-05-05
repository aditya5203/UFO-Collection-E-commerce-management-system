// server/src/modules/admin/routes/analytics.routes.ts
import { Router } from "express";
import analyticsController from "../controllers/analytics.controller";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get(
  "/",
  authorizePermission("analyticsView"),
  analyticsController.getAnalytics
);

export default router;