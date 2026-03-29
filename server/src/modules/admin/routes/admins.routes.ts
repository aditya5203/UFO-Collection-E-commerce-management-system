import { Router } from "express";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";
import { adminsController } from "../controllers/admins.controller";

const router = Router();

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

router.get("/", authorizePermission("adminsView"), adminsController.list);
router.post("/", authorizePermission("adminsCreate"), adminsController.create);
router.put("/:id", authorizePermission("adminsEdit"), adminsController.update);
router.patch(
  "/:id/status",
  authorizePermission("adminsStatus"),
  adminsController.toggleStatus
);
router.patch(
  "/:id/reset-password",
  authorizePermission("adminsResetPassword"),
  adminsController.resetPassword
);
router.delete("/:id", authorizePermission("adminsDelete"), adminsController.remove);

export default router;