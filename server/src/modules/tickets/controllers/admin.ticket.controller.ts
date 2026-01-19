import { Request, Response, NextFunction } from "express";
import { ticketService, TicketStatus } from "../services/ticket.service";

function toDateOnly(d: any) {
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
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
          id: t._id, // ✅ mongo id (use for URL)
          ticketId: t.ticketCode, // ✅ display "#12345"
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          productName: t.productId ? "Product" : "-", // populate later if you want
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
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });
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
          product: {
            name: t.productId ? "Product" : "-",
            id: t.productId || null,
          },

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
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      const updated = await ticketService.updateStatus(id, status);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });
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
        return res
          .status(400)
          .json({ success: false, message: "Reply text required" });
      }

      const updated = await ticketService.addAdminReply(id, text);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Ticket not found" });
      }

      return res.json({ success: true, item: updated });
    } catch (e) {
      next(e);
    }
  },
};
