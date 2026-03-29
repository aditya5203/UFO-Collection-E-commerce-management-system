// server/src/modules/admin/routes/dashboard.routes.ts
import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get("/summary", authorizePermission("dashboardView"), dashboardController.getSummary);

export default router;