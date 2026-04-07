// server/src/modules/admin/controllers/settings.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { adminSettingsService } from "../services/settings.service";
import { AppError } from "../../../middleware/error.middleware";

export const adminSettingsController = {
  async get(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user?.userId || "");
      const data = await adminSettingsService.getSettings(userId);

      res.json(data);
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async updateGeneral(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const general = await adminSettingsService.updateGeneral(req.body || {});

      res.json({ success: true, general });
      return;
    } catch (e: any) {
      next(new AppError(e?.message || "Failed to update settings", 400));
      return;
    }
  },

  async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user?.userId || "");
      const profile = await adminSettingsService.updateProfile(
        userId,
        req.body || {}
      );

      res.json({ success: true, profile });
      return;
    } catch (e: any) {
      next(new AppError(e?.message || "Failed to update profile", 400));
      return;
    }
  },

  async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = String(req.user?.userId || "");
      await adminSettingsService.changePassword(userId, req.body || {});

      res.json({ success: true });
      return;
    } catch (e: any) {
      next(new AppError(e?.message || "Failed to change password", 400));
      return;
    }
  },
};