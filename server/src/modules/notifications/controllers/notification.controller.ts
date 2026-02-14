//server/src/modules/notification/controllers/notification.controller.ts
import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

function pickUserId(req: Request) {
  // Your middleware likely sets req.user
  const u: any = (req as any).user;
  return u?.id || u?._id || u?.userId;
}

export const notificationController = {
  async list(req: Request, res: Response) {
    const userId = pickUserId(req);
    const limit = Number(req.query.limit ?? 50);

    const data = await notificationService.listForUser(userId, limit);

    return res.json({ success: true, data });
  },

  async unreadCount(req: Request, res: Response) {
    const userId = pickUserId(req);
    const count = await notificationService.unreadCount(userId);

    return res.json({ success: true, count });
  },

  async markRead(req: Request, res: Response) {
    const userId = pickUserId(req);
    const id = String(req.params.id || "");

    const updated = await notificationService.markRead(userId, id);

    return res.json({ success: true, data: updated });
  },

  async markAllRead(req: Request, res: Response) {
    const userId = pickUserId(req);
    await notificationService.markAllRead(userId);

    return res.json({ success: true });
  },
};
