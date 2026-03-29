// server/src/modules/tickets/controllers/customer.ticket.controller.ts
import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";

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

export const customerTicketController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUser(req);
      if (!user?.email || !user?.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const { issueType, subject, message, productId, imageUrl } = req.body || {};

      if (!issueType || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "Issue type, subject and message are required",
        });
      }

      const created = await ticketService.createTicket({
        customerId: user.userId,
        issueType,
        subject,
        message,
        customerName: user.name || "Customer",
        customerEmail: user.email,
        productId: productId || null,
        imageUrl: imageUrl || null,
      });

      return res.status(201).json({
        success: true,
        item: created,
      });
    } catch (e) {
      next(e);
    }
  },

  myList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUser(req);
      if (!user?.email) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const items = await ticketService.listCustomerTicketsByEmail(user.email);

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
            (t.replies?.length ? t.replies[t.replies.length - 1]?.createdAt : t.createdAt) ||
            t.createdAt,
        })),
      });
    } catch (e) {
      next(e);
    }
  },

  myOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUser(req);
      if (!user?.email) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const id = String(req.params.id || "");
      const t: any = await ticketService.getCustomerTicketByIdAndEmail(id, user.email);

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

  reply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUser(req);
      if (!user?.email) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const id = String(req.params.id || "");
      const text = String(req.body.text || "").trim();

      if (!text) {
        return res.status(400).json({ success: false, message: "Reply text required" });
      }

      const updated = await ticketService.addCustomerReply(id, user.email, text);

      if (!updated) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      return res.json({ success: true, item: updated });
    } catch (e) {
      next(e);
    }
  },
};