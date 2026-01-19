import { Request, Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";

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

      // multer-storage-cloudinary adds uploaded url to req.file.path / secure_url
      const imageUrl =
        (req.file as any)?.path ||
        (req.file as any)?.secure_url ||
        (req.file as any)?.url ||
        null;

      const doc = await ticketService.createTicket({
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
