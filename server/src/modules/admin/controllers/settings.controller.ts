//server/src/modules/admin/routes/settings.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { adminSettingsService } from "../services/settings.service";
import { AppError } from "../../../middleware/error.middleware";

export const adminSettingsController = {
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = String(req.user?.userId || "");
      const data = await adminSettingsService.getSettings(userId);
      return res.json(data);
    } catch (e) {
      next(e);
    }
  },

  async updateGeneral(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const general = await adminSettingsService.updateGeneral(req.body || {});
      return res.json({ success: true, general });
    } catch (e: any) {
      next(new AppError(e?.message || "Failed to update settings", 400));
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = String(req.user?.userId || "");
      const profile = await adminSettingsService.updateProfile(
        userId,
        req.body || {}
      );
      return res.json({ success: true, profile });
    } catch (e: any) {
      next(new AppError(e?.message || "Failed to update profile", 400));
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = String(req.user?.userId || "");
      await adminSettingsService.changePassword(userId, req.body || {});
      return res.json({ success: true });
    } catch (e: any) {
      next(new AppError(e?.message || "Failed to change password", 400));
    }
  },
};