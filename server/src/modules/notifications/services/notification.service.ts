import { Notification } from "../../../models/Notification.model";
import { User } from "../../../models/User.model";
import { getIO } from "../../../socket";

type NotificationType =
  | "order"
  | "payment"
  | "stock"
  | "ticket"
  | "chat"
  | "promo"
  | "user"
  | "review"
  | "system";

function serialize(doc: any) {
  return {
    _id: String(doc._id),
    id: String(doc._id),
    title: doc.title || "",
    message: doc.message || "",
    type: doc.type || "system",
    link: doc.link || "",
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    audience: doc.audience || "customer",
    meta: doc.meta || {},
  };
}

export const notificationService = {
  async createCustomer(payload: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    meta?: Record<string, any>;
  }) {
    const doc = await Notification.create({
      user: payload.userId,
      audience: "customer",
      title: payload.title,
      message: payload.message,
      type: payload.type ?? "system",
      link: payload.link ?? "",
      meta: payload.meta ?? {},
    });

    const serialized = serialize(doc);

    try {
      const io = getIO();
      io.to(`user:${String(payload.userId)}`).emit("notification:new", {
        notification: serialized,
      });
    } catch {
      // ignore
    }

    return serialized;
  },

  async createAdminForAll(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    meta?: Record<string, any>;
  }) {
    const admins = await User.find({
      role: { $in: ["admin", "superadmin"] },
    })
      .select("_id role")
      .lean();

    if (!admins.length) return [];

    const docs = await Notification.insertMany(
      admins.map((admin: any) => ({
        user: admin._id,
        audience: "admin",
        title: payload.title,
        message: payload.message,
        type: payload.type ?? "system",
        link: payload.link ?? "",
        meta: payload.meta ?? {},
      }))
    );

    const mapped = docs.map(serialize);

    try {
      const io = getIO();
      docs.forEach((doc: any) => {
        io.to(`admin:${String(doc.user)}`).emit("admin:notification:new", {
          notification: serialize(doc),
        });
      });
    } catch {
      // ignore
    }

    return mapped;
  },

  async createAdminForUser(payload: {
    adminUserId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    meta?: Record<string, any>;
  }) {
    const doc = await Notification.create({
      user: payload.adminUserId,
      audience: "admin",
      title: payload.title,
      message: payload.message,
      type: payload.type ?? "system",
      link: payload.link ?? "",
      meta: payload.meta ?? {},
    });

    const serialized = serialize(doc);

    try {
      const io = getIO();
      io.to(`admin:${String(payload.adminUserId)}`).emit("admin:notification:new", {
        notification: serialized,
      });
    } catch {
      // ignore
    }

    return serialized;
  },

  async createCustomerTicketCreatedNotification(payload: {
    userId: string;
    ticketId: string;
    ticketCode: string;
    subject?: string;
    issueType?: string;
  }) {
    return this.createCustomer({
      userId: payload.userId,
      title: "Support Ticket Created",
      message: `Your support ticket ${payload.ticketCode} was submitted successfully.`,
      type: "ticket",
      link: `/profile/tickets/${payload.ticketId}`,
      meta: {
        ticketId: payload.ticketId,
        ticketCode: payload.ticketCode,
        subject: payload.subject || "",
        issueType: payload.issueType || "",
        action: "ticket_created",
      },
    });
  },

  async createCustomerTicketReplyNotification(payload: {
    userId: string;
    ticketId: string;
    ticketCode: string;
  }) {
    return this.createCustomer({
      userId: payload.userId,
      title: "New Reply on Your Support Ticket",
      message: `Support replied to your ticket ${payload.ticketCode}.`,
      type: "ticket",
      link: `/profile/tickets/${payload.ticketId}`,
      meta: {
        ticketId: payload.ticketId,
        ticketCode: payload.ticketCode,
        action: "ticket_reply",
      },
    });
  },

  async createCustomerTicketStatusNotification(payload: {
    userId: string;
    ticketId: string;
    ticketCode: string;
    status: string;
  }) {
    return this.createCustomer({
      userId: payload.userId,
      title: "Ticket Status Updated",
      message: `Your ticket ${payload.ticketCode} is now ${payload.status}.`,
      type: "ticket",
      link: `/profile/tickets/${payload.ticketId}`,
      meta: {
        ticketId: payload.ticketId,
        ticketCode: payload.ticketCode,
        status: payload.status,
        action: "ticket_status_changed",
      },
    });
  },

  async createAdminNewTicketNotification(payload: {
    ticketId: string;
    ticketCode: string;
    customerId?: string;
    customerName: string;
    customerEmail: string;
    subject?: string;
    issueType?: string;
  }) {
    return this.createAdminForAll({
      title: "New support ticket",
      message: `${payload.customerName} submitted ticket ${payload.ticketCode}.`,
      type: "ticket",
      link: `/admin/customer-tickets/${payload.ticketId}`,
      meta: {
        ticketId: payload.ticketId,
        ticketCode: payload.ticketCode,
        customerId: payload.customerId || "",
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        subject: payload.subject || "",
        issueType: payload.issueType || "",
        action: "admin_new_ticket",
      },
    });
  },

  async createAdminTicketReplyNotification(payload: {
    ticketId: string;
    ticketCode: string;
    customerEmail: string;
    customerName?: string;
  }) {
    return this.createAdminForAll({
      title: "New Ticket Reply",
      message: `${payload.customerName || payload.customerEmail || "Customer"} replied on ticket ${payload.ticketCode}.`,
      type: "ticket",
      link: `/admin/customer-tickets/${payload.ticketId}`,
      meta: {
        ticketId: payload.ticketId,
        ticketCode: payload.ticketCode,
        customerEmail: payload.customerEmail,
        customerName: payload.customerName || "",
        action: "customer_ticket_reply",
      },
    });
  },

  async listForUser(userId: string, limit = 50) {
    const docs = await Notification.find({
      user: userId,
      audience: "customer",
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));

    return docs.map(serialize);
  },

  async unreadCount(userId: string) {
    return Notification.countDocuments({
      user: userId,
      audience: "customer",
      isRead: false,
    });
  },

  async markRead(userId: string, notificationId: string) {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId, audience: "customer" },
      { $set: { isRead: true } },
      { new: true }
    );

    return updated ? serialize(updated) : null;
  },

  async markAllRead(userId: string) {
    return Notification.updateMany(
      { user: userId, audience: "customer", isRead: false },
      { $set: { isRead: true } }
    );
  },

  async listForAdmin(adminUserId: string, limit = 50) {
    const docs = await Notification.find({
      user: adminUserId,
      audience: "admin",
    })
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));

    return docs.map(serialize);
  },

  async unreadCountForAdmin(adminUserId: string) {
    return Notification.countDocuments({
      user: adminUserId,
      audience: "admin",
      isRead: false,
    });
  },

  async markAdminRead(adminUserId: string, notificationId: string) {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, user: adminUserId, audience: "admin" },
      { $set: { isRead: true } },
      { new: true }
    );

    return updated ? serialize(updated) : null;
  },

  async markAllAdminRead(adminUserId: string) {
    return Notification.updateMany(
      { user: adminUserId, audience: "admin", isRead: false },
      { $set: { isRead: true } }
    );
  },
};