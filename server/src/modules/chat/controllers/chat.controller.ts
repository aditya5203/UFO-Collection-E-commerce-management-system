import { Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.service";

// ✅ FIX: your auth middleware sets req.user.userId
function getUserId(req: Request) {
  const u: any = (req as any).user;
  return (
    u?.userId || // ✅ THIS is the main one
    u?._id ||
    u?.id ||
    u?.user?._id ||
    u?.user?.id ||
    null
  );
}

export const chatController = {
  // CUSTOMER: open conversation
  open: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const orderId = String(req.body?.orderId || "").trim() || undefined;
      const conv = await chatService.openForCustomer(String(userId), orderId);

      return res.json({ success: true, conversation: conv });
    } catch (e) {
      next(e);
    }
  },

  // CUSTOMER: list my conversations
  mine: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const list = await chatService.listCustomerConversations(String(userId));
      return res.json({ success: true, conversations: list });
    } catch (e) {
      next(e);
    }
  },

  // CUSTOMER/ADMIN: get messages
  messages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const limit = Number(req.query.limit || 50);
      const msgs = await chatService.getMessages(conversationId, limit);
      return res.json({ success: true, messages: msgs });
    } catch (e) {
      next(e);
    }
  },

  // CUSTOMER: send message
  customerSend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { conversationId } = req.params;
      const msg = await chatService.customerSend(String(userId), conversationId, req.body);
      return res.json({ success: true, message: msg });
    } catch (e) {
      next(e);
    }
  },

  // CUSTOMER: end chat
  customerEnd: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const ended = await chatService.endChat(conversationId, "user");
      return res.json({ success: true, conversation: ended });
    } catch (e) {
      next(e);
    }
  },

  // ADMIN: list all conversations
  adminList: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await chatService.listAdminConversations();
      return res.json({ success: true, conversations: list });
    } catch (e) {
      next(e);
    }
  },

  // ADMIN: send reply
  adminSend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = getUserId(req);
      if (!adminId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const { conversationId } = req.params;
      const msg = await chatService.adminSend(String(adminId), conversationId, req.body);
      return res.json({ success: true, message: msg });
    } catch (e) {
      next(e);
    }
  },

  // ADMIN: end chat
  adminEnd: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;
      const ended = await chatService.endChat(conversationId, "admin");
      return res.json({ success: true, conversation: ended });
    } catch (e) {
      next(e);
    }
  },
};
