// server/src/modules/notification/services/notification.service.ts
import { Notification } from "../../../models/Notification.model";

export const notificationService = {
  async create(payload: {
    userId: string;
    title: string;
    message: string;
    type?: "order" | "payment" | "ticket" | "promo" | "system";
    link?: string;
    meta?: Record<string, any>;
  }) {
    return Notification.create({
      user: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? "system",
      link: payload.link ?? "",
      meta: payload.meta ?? {},
    });
  },

  async listForUser(userId: string, limit = 50) {
    return Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));
  },

  async unreadCount(userId: string) {
    return Notification.countDocuments({ user: userId, isRead: false });
  },

  async markRead(userId: string, notificationId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );
  },

  async markAllRead(userId: string) {
    return Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );
  },
};
