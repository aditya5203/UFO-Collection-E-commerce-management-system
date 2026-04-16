import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { AppError } from "../../../middleware/error.middleware";

function pickUserId(req: Request) {
  const u: any = (req as any).user;
  return u?.userId || u?.id || u?._id || null;
}

function makeBroadcastId() {
  return `broadcast_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
      const items = await notificationService.listForUser(String(userId), limit);

      res.json({
        success: true,
        data: items,
        items,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async unreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const count = await notificationService.unreadCount(String(userId));

      res.json({ success: true, count });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async markRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const id = String(req.params.id || "");
      if (!id) throw new AppError("Notification id is required", 400);

      const updated = await notificationService.markRead(String(userId), id);

      res.json({ success: true, data: updated });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async markAllRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      await notificationService.markAllRead(String(userId));

      res.json({ success: true });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async listAdmin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
      const items = await notificationService.listForAdmin(String(userId), limit);

      res.json({
        success: true,
        data: items,
        items,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async adminUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const count = await notificationService.unreadCountForAdmin(String(userId));

      res.json({ success: true, count });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async adminMarkRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const id = String(req.params.id || "");
      if (!id) throw new AppError("Notification id is required", 400);

      const updated = await notificationService.markAdminRead(String(userId), id);

      res.json({ success: true, data: updated });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async adminMarkAllRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = pickUserId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      await notificationService.markAllAdminRead(String(userId));

      res.json({ success: true });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async adminBroadcast(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminUserId = pickUserId(req);
      if (!adminUserId) throw new AppError("Unauthorized", 401);

      const title = String(req.body?.title || "").trim();
      const message = String(req.body?.message || "").trim();
      const type = String(req.body?.type || "system").trim().toLowerCase() as
        | "offer"
        | "product"
        | "account"
        | "system";
      const link = String(req.body?.link || "").trim();
      const sendEmail = Boolean(req.body?.sendEmail);

      if (!title) throw new AppError("Title is required", 400);
      if (title.length < 3) {
        throw new AppError("Title must be at least 3 characters", 400);
      }

      if (!message) throw new AppError("Message is required", 400);
      if (message.length < 5) {
        throw new AppError("Message must be at least 5 characters", 400);
      }

      const allowedTypes = ["offer", "product", "account", "system"];
      if (!allowedTypes.includes(type)) {
        throw new AppError("Invalid notification type", 400);
      }

      if (link && !link.startsWith("/")) {
        throw new AppError("Link must start with /", 400);
      }

      const broadcastId = makeBroadcastId();

      const items = await notificationService.createCustomerForAll({
        title,
        message,
        type,
        link,
        meta: {
          action: "admin_broadcast",
          broadcastId,
          createdByAdminId: String(adminUserId),
          emailRequested: sendEmail,
        },
      });

      let emailSent = 0;
      let emailFailed = 0;

      if (sendEmail) {
        const emailResult = await notificationService.sendEmailToAllCustomers({
          title,
          message,
          type,
          link,
        });

        emailSent = emailResult.sent || 0;
        emailFailed = emailResult.failed || 0;
      }

      res.status(201).json({
        success: true,
        message: sendEmail
          ? "Notification and email broadcast sent successfully"
          : "Notification sent successfully",
        count: items.length,
        emailSent,
        emailFailed,
        broadcastId,
        data: items,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async adminBroadcastHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminUserId = pickUserId(req);
      if (!adminUserId) throw new AppError("Unauthorized", 401);

      const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
      const items = await notificationService.listBroadcastHistory(limit);

      res.json({
        success: true,
        data: items,
        items,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};