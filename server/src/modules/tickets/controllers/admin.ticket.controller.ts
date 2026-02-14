import { Request, Response, NextFunction } from "express";
import { ticketService, TicketStatus } from "../services/ticket.service";

// ✅ Notifications
import { notificationService } from "../../notifications/services/notification.service";

// ✅ Ticket model
import { Ticket } from "../../../models/Ticket.model";

// ✅ User model fallback (old tickets)
import { User } from "../../../models/User.model";

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

  // fallback by email (for old tickets)
  const email = String(ticket?.customerEmail || "").trim();
  if (!email) return "";

  const u: any = await User.findOne({ email }).select("_id").lean();
  return String(u?._id || "");
}

export const adminTicketController = {
  // GET /api/admin/tickets?q=
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q || "");
      const items = await ticketService.listAdminTickets(q);

      return res.json({
        success: true,
        items: items.map((t: any) => ({
          id: t._id,
          ticketId: t.ticketCode,
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          productName: t.productId ? "Product" : "-",
          issueType: t.issueType,
          submittedAt: toDateOnly(t.createdAt),
          status: t.status,
        })),
      });
    } catch (e) {
      next(e);
    }
  },

  // GET /api/admin/tickets/:id
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id || "");
      const t: any = await ticketService.getAdminTicketById(id);

      if (!t) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      return res.json({
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

          customer: { name: t.customerName, email: t.customerEmail },
          product: { name: t.productId ? "Product" : "-", id: t.productId || null },

          replies: (t.replies || []).map((r: any) => ({
            id: r._id,
            sender: r.sender,
            text: r.text,
            createdAt: r.createdAt,
          })),
        },
      });
    } catch (e) {
      next(e);
    }
  },

  // PATCH /api/admin/tickets/:id/status
  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id || "");
      const status = String(req.body.status || "") as TicketStatus;

      if (!["Open", "Pending", "Closed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      // get current ticket for notification target
      const before: any = await Ticket.findById(id).select("status customer customerEmail ticketCode").lean();
      if (!before) return res.status(404).json({ success: false, message: "Ticket not found" });

      const updated = await ticketService.updateStatus(id, status);
      if (!updated) return res.status(404).json({ success: false, message: "Ticket not found" });

      // notify only on change
      if (String(before.status) !== String(status)) {
        const customerId = await resolveCustomerIdFromTicket(before);

        if (customerId) {
          try {
            await notificationService.create({
              userId: customerId,
              title: "Ticket Status Updated",
              message: `Your ticket ${before.ticketCode} is now ${status}.`,
              type: "ticket",
              link: `/profile/tickets/${id}`,
              meta: { ticketId: id, ticketCode: before.ticketCode, status },
            });
          } catch {}
        }
      }

      return res.json({ success: true, item: updated });
    } catch (e) {
      next(e);
    }
  },

  // POST /api/admin/tickets/:id/reply
  reply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id || "");
      const text = String(req.body.text || "").trim();

      if (!text) {
        return res.status(400).json({ success: false, message: "Reply text required" });
      }

      // Save reply
      const updated: any = await ticketService.addAdminReply(id, text);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      // Fresh ticket to get customer
      const fresh: any = await Ticket.findById(id).select("customer customerEmail ticketCode").lean();
      const customerId = await resolveCustomerIdFromTicket(fresh);

      // Create notification
      if (customerId) {
        try {
          await notificationService.create({
            userId: customerId,
            title: "Support Reply",
            message: `Admin replied on your ticket ${fresh.ticketCode}.`,
            type: "ticket",
            link: `/profile/tickets/${id}`,
            meta: { ticketId: id, ticketCode: fresh.ticketCode },
          });
        } catch {}
      }

      return res.json({ success: true, item: updated });
    } catch (e) {
      next(e);
    }
  },
};
