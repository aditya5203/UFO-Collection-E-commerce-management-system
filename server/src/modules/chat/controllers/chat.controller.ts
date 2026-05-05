import { Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.service";

function getUserId(req: Request) {
  const u: any = (req as any).user;
  return u?.userId || u?._id || u?.id || u?.user?._id || u?.user?.id || null;
}

export const chatController = {
  open: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const orderId = String(req.body?.orderId || "").trim() || undefined;
      const forceNew = Boolean(req.body?.forceNew);

      const conv = await chatService.openForCustomer(
        String(userId),
        orderId,
        forceNew
      );

      res.json({
        success: true,
        conversation: conv,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  mine: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const list = await chatService.listCustomerConversations(String(userId));

      res.json({
        success: true,
        conversations: list,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  messages: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { conversationId } = req.params;
      const limit = Number(req.query.limit || 50);

      const result = await chatService.getConversationWithMessages(
        conversationId,
        limit
      );

      res.json({
        success: true,
        conversation: result.conversation,
        messages: result.messages,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  customerSend: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { conversationId } = req.params;

      const msg = await chatService.customerSend(
        String(userId),
        conversationId,
        req.body
      );

      res.json({
        success: true,
        message: msg,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  customerEnd: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { conversationId } = req.params;

      const ended = await chatService.customerEnd(
        String(userId),
        conversationId
      );

      res.json({
        success: true,
        conversation: ended,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  adminList: async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const list = await chatService.listAdminConversations();

      res.json({
        success: true,
        conversations: list,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  adminSend: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = getUserId(req);

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { conversationId } = req.params;

      const msg = await chatService.adminSend(
        String(adminId),
        conversationId,
        req.body
      );

      res.json({
        success: true,
        message: msg,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  adminEnd: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const adminId = getUserId(req);

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { conversationId } = req.params;

      const ended = await chatService.adminEnd(
        String(adminId),
        conversationId
      );

      res.json({
        success: true,
        conversation: ended,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};