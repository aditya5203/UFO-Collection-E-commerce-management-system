import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { notificationService } from "../../notifications/services/notification.service";
import { getIO } from "../../../socket";

function getUser(req: Request) {
  return (req as any).user || null;
}

function toDateOnly(d: any) {
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function emitSafe(fn: () => void) {
  try {
    fn();
  } catch (e: any) {
    console.log("Ticket socket emit failed (ignored):", e?.message);
  }
}

export const customerTicketController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = getUser(req);

      if (!user?.email || !user?.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const {
        issueType,
        subject,
        message,
        orderId,
        productId,
        productName,
        size,
        color,
        imageUrl,
      } = req.body || {};

      if (!issueType || !subject || !message) {
        res.status(400).json({
          success: false,
          message: "Issue type, subject and message are required",
        });
        return;
      }

      const uploadedImageUrl =
        (req.file as any)?.path ||
        (req.file as any)?.secure_url ||
        (req.file as any)?.url ||
        imageUrl ||
        null;

      const created = await ticketService.createTicket({
        customerId: user.userId,
        issueType: String(issueType).trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
        customerName: user.name || "Customer",
        customerEmail: user.email,
        orderId: orderId ? String(orderId).trim() : null,
        productId: productId ? String(productId).trim() : null,
        productName: productName ? String(productName).trim() : null,
        size: size ? String(size).trim() : null,
        color: color ? String(color).trim() : null,
        imageUrl: uploadedImageUrl,
      });

      try {
        await notificationService.createAdminForAll({
          title: "New support ticket",
          message: `${user.name || user.email || "Customer"} submitted ticket ${
            created.ticketCode
          }.`,
          type: "ticket",
          link: `/admin/tickets/${String((created as any)._id)}`,
          meta: {
            ticketId: String((created as any)._id),
            ticketCode: created.ticketCode,
            customerId: String(user.userId),
            customerName: user.name || "Customer",
            customerEmail: user.email,
            subject: created.subject || "",
            issueType: created.issueType || "",
          },
        });
      } catch (e: any) {
        console.log("Admin ticket notification failed (ignored):", e?.message);
      }

      emitSafe(() => {
        const io = getIO();

        io.to("admins").emit("admin:ticket:new", {
          ticketId: String((created as any)._id),
          ticketCode: created.ticketCode,
          status: created.status,
          customerName: user.name || "Customer",
          customerEmail: user.email,
          subject: created.subject,
          issueType: created.issueType,
          productName: created.productName || null,
          orderId: created.orderId || null,
          submittedAt: created.createdAt,
          updatedAt: new Date().toISOString(),
        });
      });

      res.status(201).json({
        success: true,
        item: created,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  myList: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = getUser(req);

      if (!user?.email) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const items = await ticketService.listCustomerTicketsByEmail(user.email);

      res.json({
        success: true,
        items: items.map((t: any) => ({
          id: t._id,
          ticketId: t.ticketCode,
          ticketCode: t.ticketCode,
          status: t.status,
          issueType: t.issueType,
          subject: t.subject,
          submittedAt: toDateOnly(t.createdAt),
          orderId: t.orderId || null,
          productId: t.productId || null,
          productName: t.productName || null,
          size: t.size || null,
          color: t.color || null,
          lastReplyAt:
            (t.replies?.length
              ? t.replies[t.replies.length - 1]?.createdAt
              : t.createdAt) || t.createdAt,
        })),
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  myOne: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = getUser(req);

      if (!user?.email) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id || "");

      const t: any = await ticketService.getCustomerTicketByIdAndEmail(
        id,
        user.email
      );

      if (!t) {
        res.status(404).json({ success: false, message: "Ticket not found" });
        return;
      }

      res.json({
        success: true,
        item: {
          id: t._id,
          ticketCode: t.ticketCode,
          status: t.status,
          submittedAt: t.createdAt,
          issueType: t.issueType,
          subject: t.subject,
          message: t.message,
          orderId: t.orderId || null,
          productId: t.productId || null,
          productName: t.productName || null,
          size: t.size || null,
          color: t.color || null,
          imageUrl: t.imageUrl || null,
          product: {
            id: t.productId || null,
            name: t.productName || "-",
          },
          replies: (t.replies || []).map((r: any) => ({
            id: r._id,
            sender: r.sender,
            text: r.text,
            createdAt: r.createdAt,
          })),
        },
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  reply: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = getUser(req);

      if (!user?.email) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id || "");
      const text = String(req.body.text || "").trim();

      if (!text) {
        res.status(400).json({
          success: false,
          message: "Reply text required",
        });
        return;
      }

      const updated: any = await ticketService.addCustomerReply(
        id,
        user.email,
        text
      );

      if (!updated) {
        res.status(404).json({ success: false, message: "Ticket not found" });
        return;
      }

      try {
        const fresh: any = await ticketService.getCustomerTicketByIdAndEmail(
          id,
          user.email
        );

        if (fresh) {
          await notificationService.createAdminForAll({
            title: "New ticket reply",
            message: `${
              user.name || user.email || "Customer"
            } replied on ticket ${fresh.ticketCode}.`,
            type: "ticket",
            link: `/admin/tickets/${String(fresh._id)}`,
            meta: {
              ticketId: String(fresh._id),
              ticketCode: fresh.ticketCode,
              customerEmail: user.email,
            },
          });

          const lastReply = Array.isArray(fresh?.replies)
            ? fresh.replies[fresh.replies.length - 1]
            : null;

          emitSafe(() => {
            const io = getIO();

            const payload = {
              ticketId: String(fresh._id),
              ticketCode: fresh.ticketCode,
              status: fresh.status || updated?.status,
              customerName: user.name || "Customer",
              customerEmail: user.email,
              reply: {
                id: lastReply?._id || "",
                sender: "customer",
                text,
                createdAt: lastReply?.createdAt || new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            };

            io.to("admins").emit("admin:ticket:reply:new", payload);

            if (user.userId) {
              io.to(`user:${String(user.userId)}`).emit(
                "ticket:reply:new",
                payload
              );
            }
          });
        }
      } catch (e: any) {
        console.log(
          "Admin ticket reply notification/socket failed (ignored):",
          e?.message
        );
      }

      res.json({ success: true, item: updated });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};