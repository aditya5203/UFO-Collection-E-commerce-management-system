import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";

// Assumes your auth middleware sets req.user
function getUserEmail(req: Request) {
  const u: any = (req as any).user;
  return String(u?.email || "").trim();
}

function toDateOnly(d: any) {
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export const customerTicketController = {
  // GET /api/tickets/my
  myList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = getUserEmail(req);
      if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

      const items = await ticketService.listCustomerTicketsByEmail(email);

      return res.json({
        success: true,
        items: items.map((t: any) => ({
          id: t._id,
           ticketId: t.ticketCode, 
          ticketCode: t.ticketCode,
          status: t.status,
          issueType: t.issueType,
          subject: t.subject,
          submittedAt: toDateOnly(t.createdAt),
          productId: t.productId || null,
          lastReplyAt:
            (t.replies?.length ? t.replies[t.replies.length - 1]?.createdAt : t.createdAt) || t.createdAt,
        })),
      });
    } catch (e) {
      next(e);
    }
  },

  // GET /api/tickets/my/:id
  myOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = getUserEmail(req);
      if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

      const id = String(req.params.id || "");
      const t: any = await ticketService.getCustomerTicketByIdAndEmail(id, email);

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
          productId: t.productId || null,
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

  // POST /api/tickets/my/:id/reply  (optional - customer reply back)
  reply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = getUserEmail(req);
      if (!email) return res.status(401).json({ success: false, message: "Unauthorized" });

      const id = String(req.params.id || "");
      const text = String(req.body.text || "").trim();
      if (!text) return res.status(400).json({ success: false, message: "Reply text required" });

      const updated = await ticketService.addCustomerReply(id, email, text);
      if (!updated) return res.status(404).json({ success: false, message: "Ticket not found" });

      return res.json({ success: true, item: updated });
    } catch (e) {
      next(e);
    }
  },
};
