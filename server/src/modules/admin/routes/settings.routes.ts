// server/src/modules/admin/routes/settings.routes.ts
import { Router } from "express";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";
import { adminSettingsController } from "../controllers/settings.controller";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get("/settings", authorizePermission("settingsView"), adminSettingsController.get);
router.put("/settings", authorizePermission("settingsView"), adminSettingsController.updateGeneral);
router.put("/profile", authorizePermission("settingsView"), adminSettingsController.updateProfile);
router.put("/change-password", authorizePermission("settingsView"), adminSettingsController.changePassword);

export default router;