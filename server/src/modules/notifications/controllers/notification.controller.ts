// server/src/modules/notifications/controllers/notification.controller.ts
import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { AppError } from "../../../middleware/error.middleware";

function pickUserId(req: Request) {
  const u: any = (req as any).user;
  return u?.userId || u?.id || u?._id || null;
}

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));

      const items = await notificationService.listForUser(String(userId), limit);

      // ✅ Return both `data` and `items` so frontend parsing never fails
      return res.json({
        success: true,
        data: items,
        items,
      });
    } catch (e) {
      next(e);
    }
  },

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const count = await notificationService.unreadCount(String(userId));

      return res.json({ success: true, count });
    } catch (e) {
      next(e);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const id = String(req.params.id || "");
      if (!id) throw new AppError("Notification id is required", 400);

      const updated = await notificationService.markRead(String(userId), id);

      return res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      await notificationService.markAllRead(String(userId));

      return res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
};
