import { Notification } from "../../../models/Notification.model";
import { User } from "../../../models/User.model";
import { getIO } from "../../../socket";
import { emailService } from "../../../services/email.services";

type NotificationType =
  | "order"
  | "payment"
  | "stock"
  | "ticket"
  | "chat"
  | "promo"
  | "user"
  | "review"
  | "system"
  | "offer"
  | "product"
  | "account";

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
    expiresAt: doc.expiresAt || null,
  };
}

function getDefaultExpiry(type?: NotificationType): Date | null {
  const now = new Date();

  switch (type) {
    case "offer":
    case "promo":
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    case "product":
      return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    case "system":
      return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    case "account":
      return null;

    default:
      return null;
  }
}

function buildActiveCustomerFilter(userId: string) {
  const now = new Date();

  return {
    user: userId,
    audience: "customer",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
}

function normalizeLink(link?: string) {
  return String(link || "").trim();
}

function extractOrderId(meta?: Record<string, any>): string {
  if (!meta || typeof meta !== "object") return "";

  const directCandidates = [
    meta.orderId,
    meta.orderNumber,
    meta.orderCode,
    meta.id,
    meta._id,
  ];

  for (const value of directCandidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  if (meta.order && typeof meta.order === "object") {
    const nestedCandidates = [
      meta.order.orderId,
      meta.order.orderNumber,
      meta.order.orderCode,
      meta.order.id,
      meta.order._id,
    ];

    for (const value of nestedCandidates) {
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }
  }

  return "";
}

function resolveCustomerAutoLink(
  type?: NotificationType,
  providedLink?: string,
  meta?: Record<string, any>
) {
  const cleanLink = normalizeLink(providedLink);
  if (cleanLink) return cleanLink;

  switch (type) {
    case "offer":
      return "/homepage";

    case "product":
      return "/collection";

    case "account":
      return "/profile";

    case "system":
      return "/homepage";

    case "ticket":
      return "/profile/tickets";

    case "chat":
      return "/live-agent-chat";

    case "order": {
      const orderId = extractOrderId(meta);
      return orderId ? `/customerorderdetails/${String(orderId).replace(/^#/, "")}` : "/profile/orders";
    }

    case "payment": {
      const orderId = extractOrderId(meta);
      return orderId ? `/customerorderdetails/${String(orderId).replace(/^#/, "")}` : "/profile/orders";
    }

    case "stock":
      return "/collection";

    case "promo":
      return "/homepage";

    case "user":
      return "/profile";

    case "review":
      return "/profile/orders";

    default:
      return "/homepage";
  }
}

function buildBroadcastEmailSubject(type?: NotificationType, title?: string) {
  const safeTitle = String(title || "").trim();

  switch (type) {
    case "offer":
      return safeTitle || "New Offer - UFO Collection";
    case "product":
      return safeTitle || "New Product Update - UFO Collection";
    case "account":
      return safeTitle || "Account Update - UFO Collection";
    case "system":
      return safeTitle || "Important Notice - UFO Collection";
    default:
      return safeTitle || "UFO Collection Update";
  }
}

function buildBroadcastEmailCTA(type?: NotificationType) {
  switch (type) {
    case "offer":
      return "Shop Now";
    case "product":
      return "Explore Collection";
    case "account":
      return "Open Profile";
    case "system":
      return "Visit Website";
    default:
      return "Open";
  }
}

export const notificationService = {
  async createCustomer(payload: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    meta?: Record<string, any>;
    expiresAt?: Date | null;
  }) {
    const resolvedLink = resolveCustomerAutoLink(
      payload.type,
      payload.link,
      payload.meta
    );

    const doc = await Notification.create({
      user: payload.userId,
      audience: "customer",
      title: payload.title,
      message: payload.message,
      type: payload.type ?? "system",
      link: resolvedLink,
      meta: payload.meta ?? {},
      expiresAt:
        payload.expiresAt === undefined
          ? getDefaultExpiry(payload.type)
          : payload.expiresAt,
    });

    const serialized = serialize(doc);

    try {
      const io = getIO();
      io.to(`user:${String(payload.userId)}`).emit("notification:new", {
        notification: serialized,
      });
    } catch {
      // ignore socket failure
    }

    return serialized;
  },

  async createCustomerForAll(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    meta?: Record<string, any>;
    expiresAt?: Date | null;
  }) {
    const customers = await User.find({
      role: { $nin: ["admin", "superadmin"] },
    })
      .select("_id role")
      .lean();

    if (!customers.length) return [];

    const expiresAt =
      payload.expiresAt === undefined
        ? getDefaultExpiry(payload.type)
        : payload.expiresAt;

    const resolvedLink = resolveCustomerAutoLink(
      payload.type,
      payload.link,
      payload.meta
    );

    const docs = await Notification.insertMany(
      customers.map((customer: any) => ({
        user: customer._id,
        audience: "customer",
        title: payload.title,
        message: payload.message,
        type: payload.type ?? "system",
        link: resolvedLink,
        meta: payload.meta ?? {},
        expiresAt,
      }))
    );

    const mapped = docs.map(serialize);

    try {
      const io = getIO();
      docs.forEach((doc: any) => {
        io.to(`user:${String(doc.user)}`).emit("notification:new", {
          notification: serialize(doc),
        });
      });
    } catch {
      // ignore socket failure
    }

    return mapped;
  },

  async sendEmailToAllCustomers(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
  }) {
    const users = await User.find({
      role: { $nin: ["admin", "superadmin"] },
      email: { $exists: true, $ne: "" },
      isDeleted: { $ne: true },
      isBlocked: { $ne: true },
    })
      .select("email name")
      .lean();

    if (!users.length) return { sent: 0, failed: 0 };

    const resolvedLink = resolveCustomerAutoLink(payload.type, payload.link, {});
    const clientBase = (process.env.CLIENT_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
    const fullLink = resolvedLink ? `${clientBase}${resolvedLink}` : "";
    const subject = buildBroadcastEmailSubject(payload.type, payload.title);
    const cta = buildBroadcastEmailCTA(payload.type);

    let sent = 0;
    let failed = 0;

    for (const user of users as any[]) {
      try {
        await emailService.sendMail({
          to: String(user.email || "").trim(),
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;">
              <h2 style="margin-bottom:12px;">${payload.title}</h2>

              <p>Hi <strong>${user.name || "Customer"}</strong>,</p>

              <p>${payload.message}</p>

              ${
                fullLink
                  ? `
                    <p style="margin:20px 0;">
                      <a href="${fullLink}"
                         style="display:inline-block;padding:12px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
                        ${cta}
                      </a>
                    </p>
                    <p style="font-size:12px;color:#666;">
                      If the button does not work, copy this link:<br/>
                      <span>${fullLink}</span>
                    </p>
                  `
                  : ""
              }

              <p style="margin-top:24px;">Thanks,<br/><strong>UFO Collection</strong></p>
            </div>
          `,
        });

        sent++;
      } catch (err: any) {
        failed++;
        console.log("Broadcast email failed:", user.email, err?.message || err);
      }
    }

    return { sent, failed };
  },

  async createAdminForAll(payload: {
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    meta?: Record<string, any>;
    expiresAt?: Date | null;
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
        expiresAt: payload.expiresAt ?? null,
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
      // ignore socket failure
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
    expiresAt?: Date | null;
  }) {
    const doc = await Notification.create({
      user: payload.adminUserId,
      audience: "admin",
      title: payload.title,
      message: payload.message,
      type: payload.type ?? "system",
      link: payload.link ?? "",
      meta: payload.meta ?? {},
      expiresAt: payload.expiresAt ?? null,
    });

    const serialized = serialize(doc);

    try {
      const io = getIO();
      io.to(`admin:${String(payload.adminUserId)}`).emit(
        "admin:notification:new",
        {
          notification: serialized,
        }
      );
    } catch {
      // ignore socket failure
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
      expiresAt: null,
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
      expiresAt: null,
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
      expiresAt: null,
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
      message: `${
        payload.customerName || payload.customerEmail || "Customer"
      } replied on ticket ${payload.ticketCode}.`,
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
    const docs = await Notification.find(buildActiveCustomerFilter(userId))
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));

    return docs.map(serialize);
  },

  async unreadCount(userId: string) {
    return Notification.countDocuments({
      ...buildActiveCustomerFilter(userId),
      isRead: false,
    });
  },

  async markRead(userId: string, notificationId: string) {
    const updated = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        ...buildActiveCustomerFilter(userId),
      },
      { $set: { isRead: true } },
      { new: true }
    );

    return updated ? serialize(updated) : null;
  },

  async markAllRead(userId: string) {
    return Notification.updateMany(
      {
        ...buildActiveCustomerFilter(userId),
        isRead: false,
      },
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

  async listBroadcastHistory(limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const rows = await Notification.aggregate([
      {
        $match: {
          audience: "customer",
          "meta.action": "admin_broadcast",
          "meta.broadcastId": { $exists: true, $ne: "" },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$meta.broadcastId",
          title: { $first: "$title" },
          message: { $first: "$message" },
          type: { $first: "$type" },
          link: { $first: "$link" },
          expiresAt: { $first: "$expiresAt" },
          createdAt: { $first: "$createdAt" },
          createdByAdminId: { $first: "$meta.createdByAdminId" },
          sentCount: { $sum: 1 },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: safeLimit },
    ]);

    return rows.map((row: any) => ({
      broadcastId: String(row._id),
      title: row.title || "",
      message: row.message || "",
      type: row.type || "system",
      link: row.link || "",
      expiresAt: row.expiresAt || null,
      createdAt: row.createdAt,
      sentCount: Number(row.sentCount || 0),
      createdByAdminId: row.createdByAdminId || "",
      isExpired: row.expiresAt
        ? new Date(row.expiresAt).getTime() <= Date.now()
        : false,
    }));
  },
};