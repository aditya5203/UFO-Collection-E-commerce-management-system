import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";

function getUser(req: Request) {
  return (req as any).user || null;
}

export const ticketController = {
  // POST /api/tickets (multipart/form-data)
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { issueType, subject, message, name, email, productId } = req.body;

      if (!issueType || !subject || !message || !name || !email) {
        return res.status(400).json({
          success: false,
          message: "issueType, subject, message, name, email are required",
        });
      }

      // multer-storage-cloudinary adds url to req.file.path
      const imageUrl =
        (req.file as any)?.path ||
        (req.file as any)?.secure_url ||
        (req.file as any)?.url ||
        null;

      // ✅ if user is logged in, store customerId for notifications
      const user = getUser(req);
      const customerId = user?.userId ? String(user.userId) : null;

      const doc = await ticketService.createTicket({
        customerId, // ✅ important
        issueType: String(issueType).trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
        customerName: String(name).trim(),
        customerEmail: String(email).trim(),
        productId: productId ? String(productId) : null,
        imageUrl,
      });

      return res.status(201).json({
        success: true,
        item: {
          id: doc._id,
          ticketCode: doc.ticketCode,
          status: doc.status,
          imageUrl: doc.imageUrl,
          createdAt: doc.createdAt,
        },
      });
    } catch (e) {
      next(e);
    }
  },
};
