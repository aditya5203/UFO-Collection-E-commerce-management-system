import { Request, Response, NextFunction } from "express";
import { ticketService, TicketStatus } from "../services/ticket.service";
import { notificationService } from "../../notifications/services/notification.service";
import { Ticket } from "../../../models/Ticket.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";
import { getIO } from "../../../socket";

function toDateOnly(d: any) {
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

async function resolveCustomerIdFromTicket(ticket: any) {
  const direct = String(ticket?.customer || "");
  if (direct) return direct;

  const email = String(ticket?.customerEmail || "").trim();
  if (!email) return "";

  const u: any = await User.findOne({ email }).select("_id").lean();
  return String(u?._id || "");
}

function emitSafe(fn: () => void) {
  try {
    fn();
  } catch (e: any) {
    console.log("Ticket socket emit failed (ignored):", e?.message);
  }
}

export const adminTicketController = {
  list: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const q = String(req.query.q || "");
      const items = await ticketService.listAdminTickets(q);

      const productIds = items
        .map((t: any) => String(t.productId || ""))
        .filter(Boolean);

      const products = productIds.length
        ? await Product.find({ _id: { $in: productIds } })
            .select("_id name")
            .lean()
        : [];

      const productMap = new Map<string, string>(
        (products as any[]).map((p) => [String(p._id), p.name || "Product"])
      );

      res.json({
        success: true,
        items: items.map((t: any) => ({
          id: t._id,
          ticketId: t.ticketCode,
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          productName:
            t.productName ||
            (t.productId
              ? productMap.get(String(t.productId)) || "Product"
              : "-"),
          orderId: t.orderId || null,
          size: t.size || null,
          color: t.color || null,
          issueType: t.issueType,
          submittedAt: toDateOnly(t.createdAt),
          status: t.status,
        })),
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  getOne: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = String(req.params.id || "");
      const t: any = await ticketService.getAdminTicketById(id);

      if (!t) {
        res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
        return;
      }

      let productName = t.productName || "-";
      let productId = t.productId || null;

      if (!productName || productName === "-") {
        if (t.productId) {
          const p: any = await Product.findById(t.productId)
            .select("_id name")
            .lean();
          productName = p?.name || "Product";
          productId = p?._id || t.productId || null;
        }
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
          imageUrl: t.imageUrl || null,
          orderId: t.orderId || null,
          size: t.size || null,
          color: t.color || null,
          customer: {
            name: t.customerName,
            email: t.customerEmail,
          },
          product: {
            name: productName,
            id: productId || null,
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

  updateStatus: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = String(req.params.id || "");
      const status = String(req.body.status || "") as TicketStatus;

      if (
        !["Open", "Pending", "In Progress", "Resolved", "Closed"].includes(
          status
        )
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid status",
        });
        return;
      }

      const before: any = await Ticket.findById(id)
        .select("status customer customerEmail ticketCode")
        .lean();

      if (!before) {
        res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
        return;
      }

      const updated: any = await ticketService.updateStatus(id, status);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
        return;
      }

      const customerId = await resolveCustomerIdFromTicket(before);

      if (String(before.status) !== String(status)) {
        if (customerId) {
          try {
            await notificationService.createCustomer({
              userId: customerId,
              title: "Ticket Status Updated",
              message: `Your ticket ${before.ticketCode} is now ${status}.`,
              type: "ticket",
              link: `/profile/tickets/${id}`,
              meta: { ticketId: id, ticketCode: before.ticketCode, status },
            });
          } catch {}
        }

        emitSafe(() => {
          const io = getIO();

          if (customerId) {
            io.to(`user:${customerId}`).emit("ticket:updated", {
              ticketId: id,
              ticketCode: before.ticketCode,
              status,
              message: `Your ticket ${before.ticketCode} is now ${status}.`,
              updatedAt: new Date().toISOString(),
            });
          }

          io.to("admins").emit("admin:ticket:updated", {
            ticketId: id,
            ticketCode: before.ticketCode,
            status,
            updatedAt: new Date().toISOString(),
          });
        });
      }

      res.json({ success: true, item: updated });
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
      const id = String(req.params.id || "");
      const text = String(req.body.text || "").trim();

      if (!text) {
        res.status(400).json({
          success: false,
          message: "Reply text required",
        });
        return;
      }

      const updated: any = await ticketService.addAdminReply(id, text);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
        return;
      }

      const fresh: any = await Ticket.findById(id)
        .select("customer customerEmail ticketCode status replies")
        .lean();

      const customerId = await resolveCustomerIdFromTicket(fresh);
      const lastReply = Array.isArray(fresh?.replies)
        ? fresh.replies[fresh.replies.length - 1]
        : null;

      if (customerId) {
        try {
          await notificationService.createCustomer({
            userId: customerId,
            title: "Support Reply",
            message: `Admin replied on your ticket ${fresh.ticketCode}.`,
            type: "ticket",
            link: `/profile/tickets/${id}`,
            meta: { ticketId: id, ticketCode: fresh.ticketCode },
          });
        } catch {}
      }

      emitSafe(() => {
        const io = getIO();

        const payload = {
          ticketId: id,
          ticketCode: fresh?.ticketCode,
          status: fresh?.status || updated?.status,
          reply: {
            id: lastReply?._id || "",
            sender: "admin",
            text,
            createdAt: lastReply?.createdAt || new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        };

        if (customerId) {
          io.to(`user:${customerId}`).emit("ticket:reply:new", payload);
        }

        io.to("admins").emit("admin:ticket:reply:new", payload);
      });

      res.json({ success: true, item: updated });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};