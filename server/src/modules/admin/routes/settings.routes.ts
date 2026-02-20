import { Router } from "express";
import { adminAuthMiddleware, authorize } from "../../auth/middleware/auth.middleware";
import { adminSettingsController } from "../controllers/settings.controller";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

// ✅ matches frontend
router.get("/settings", adminSettingsController.get);
router.put("/settings", adminSettingsController.updateGeneral);

router.put("/profile", adminSettingsController.updateProfile);
router.put("/change-password", adminSettingsController.changePassword);

export default router;
