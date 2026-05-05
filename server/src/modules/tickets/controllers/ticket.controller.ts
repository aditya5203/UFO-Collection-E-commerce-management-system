import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { notificationService } from "../../notifications/services/notification.service";
import { getIO } from "../../../socket";

function getUser(req: Request) {
  return (req as any).user || null;
}

function emitSafe(fn: () => void) {
  try {
    fn();
  } catch (e: any) {
    console.log("Ticket socket emit failed (ignored):", e?.message);
  }
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

      const doc: any = await ticketService.createTicket({
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
          link: `/admin/customer-tickets/${String(doc._id)}`,
          meta: {
            ticketId: String(doc._id),
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

      emitSafe(() => {
        const io = getIO();

        io.to("admins").emit("admin:ticket:new", {
          ticketId: String(doc._id),
          ticketCode: doc.ticketCode,
          status: doc.status,
          customerName: String(name).trim(),
          customerEmail: String(email).trim(),
          subject: doc.subject,
          issueType: doc.issueType,
          productName: doc.productName || null,
          orderId: doc.orderId || null,
          size: doc.size || null,
          color: doc.color || null,
          submittedAt: doc.createdAt,
          updatedAt: new Date().toISOString(),
        });
      });

      res.status(201).json({
        success: true,
        item: {
          id: String(doc._id),
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