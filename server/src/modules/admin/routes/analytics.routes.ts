import { Router } from "express";
import analyticsController from "../controllers/analytics.controller";
import { adminAuthMiddleware, authorize } from "../../auth/middleware/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get("/", analyticsController.getAnalytics);

export default router;