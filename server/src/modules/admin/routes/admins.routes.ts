import { Router } from "express";
import { adminAuthMiddleware, authorize } from "../../auth/middleware/auth.middleware";
import { adminsController } from "../controllers/admins.controller";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get("/", adminsController.list);
router.post("/", authorize("superadmin"), adminsController.create);

export default router;
