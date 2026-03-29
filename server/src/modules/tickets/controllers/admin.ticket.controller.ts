// server/src/modules/tickets/controllers/admin.ticket.controller.ts
import { Request, Response, NextFunction } from "express";
import { ticketService, TicketStatus } from "../services/ticket.service";
import { notificationService } from "../../notifications/services/notification.service";
import { Ticket } from "../../../models/Ticket.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";

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

export const adminTicketController = {
  /**
   * @swagger
   * /api/admin/tickets:
   *   get:
   *     summary: List admin tickets
   *     tags: [Tickets - Admin]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Tickets list
   */
  list: async (req: Request, res: Response, next: NextFunction) => {
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

      return res.json({
        success: true,
        items: items.map((t: any) => ({
          id: t._id,
          ticketId: t.ticketCode,
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          productName: t.productId ? productMap.get(String(t.productId)) || "Product" : "-",
          issueType: t.issueType,
          submittedAt: toDateOnly(t.createdAt),
          status: t.status,
        })),
      });
    } catch (e) {
      next(e);
    }
  },

  /**
   * @swagger
   * /api/admin/tickets/{id}:
   *   get:
   *     summary: Get ticket details
   *     tags: [Tickets - Admin]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Ticket detail
   */
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id || "");
      const t: any = await ticketService.getAdminTicketById(id);

      if (!t) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      let productName = "-";
      if (t.productId) {
        const p: any = await Product.findById(t.productId).select("_id name").lean();
        productName = p?.name || "Product";
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
          product: { name: productName, id: t.productId || null },
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

  /**
   * @swagger
   * /api/admin/tickets/{id}/status:
   *   patch:
   *     summary: Update ticket status
   *     tags: [Tickets - Admin]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Status updated
   */
  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id || "");
      const status = String(req.body.status || "") as TicketStatus;

      if (!["Open", "Pending", "Closed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      const before: any = await Ticket.findById(id)
        .select("status customer customerEmail ticketCode")
        .lean();

      if (!before) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      const updated = await ticketService.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

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

  /**
   * @swagger
   * /api/admin/tickets/{id}/reply:
   *   post:
   *     summary: Reply to ticket
   *     tags: [Tickets - Admin]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Reply added
   */
  reply: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id || "");
      const text = String(req.body.text || "").trim();

      if (!text) {
        return res.status(400).json({ success: false, message: "Reply text required" });
      }

      const updated: any = await ticketService.addAdminReply(id, text);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Ticket not found" });
      }

      const fresh: any = await Ticket.findById(id)
        .select("customer customerEmail ticketCode")
        .lean();
      const customerId = await resolveCustomerIdFromTicket(fresh);

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