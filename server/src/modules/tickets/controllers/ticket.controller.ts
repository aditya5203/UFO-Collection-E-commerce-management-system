import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { notificationService } from "../../notifications/services/notification.service";

function getUser(req: Request) {
  return (req as any).user || null;
}

export const ticketController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const {
        issueType,
        subject,
        message,
        name,
        email,
        orderId,
        productId,
        productName,
        size,
        color,
      } = req.body;

      if (!issueType || !subject || !message || !name || !email) {
        res.status(400).json({
          success: false,
          message: "issueType, subject, message, name, email are required",
        });
        return;
      }

      const imageUrl =
        (req.file as any)?.path ||
        (req.file as any)?.secure_url ||
        (req.file as any)?.url ||
        null;

      const user = getUser(req);
      const customerId = user?.userId ? String(user.userId) : null;

      const doc = await ticketService.createTicket({
        customerId,
        issueType: String(issueType).trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
        customerName: String(name).trim(),
        customerEmail: String(email).trim(),
        orderId: orderId ? String(orderId).trim() : null,
        productId: productId ? String(productId).trim() : null,
        productName: productName ? String(productName).trim() : null,
        size: size ? String(size).trim() : null,
        color: color ? String(color).trim() : null,
        imageUrl,
      });

      try {
        await notificationService.createAdminForAll({
          title: "New support ticket",
          message: `${String(name).trim()} submitted ticket ${doc.ticketCode}.`,
          type: "ticket",
          link: `/admin/tickets/${String((doc as any)._id)}`,
          meta: {
            ticketId: String((doc as any)._id),
            ticketCode: doc.ticketCode,
            customerId: customerId || "",
            customerName: String(name).trim(),
            customerEmail: String(email).trim(),
            subject: doc.subject || "",
            issueType: doc.issueType || "",
          },
        });
      } catch (e: any) {
        console.log("Public ticket notification failed (ignored):", e?.message);
      }

      res.status(201).json({
        success: true,
        item: {
          id: doc._id,
          ticketCode: doc.ticketCode,
          status: doc.status,
          orderId: doc.orderId || null,
          productId: doc.productId || null,
          productName: doc.productName || null,
          size: doc.size || null,
          color: doc.color || null,
          imageUrl: doc.imageUrl,
          createdAt: doc.createdAt,
        },
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};