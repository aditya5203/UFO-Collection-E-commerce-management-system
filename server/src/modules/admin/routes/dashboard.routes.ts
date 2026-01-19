import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { adminAuthMiddleware, authorize } from "../../auth/middleware/auth.middleware";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get("/summary", dashboardController.getSummary);

export default router;
