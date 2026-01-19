import { Router } from "express";
import { chatController } from "../controllers/chat.controller";

const router = Router();

// (adminAuthMiddleware applied in routes/index.ts)

// GET /api/admin/chat/conversations
router.get("/conversations", chatController.adminList);

// GET /api/admin/chat/conversations/:conversationId/messages
router.get("/conversations/:conversationId/messages", chatController.messages);

// POST /api/admin/chat/conversations/:conversationId/messages
router.post("/conversations/:conversationId/messages", chatController.adminSend);

// PATCH /api/admin/chat/conversations/:conversationId/end
router.patch("/conversations/:conversationId/end", chatController.adminEnd);

export default router;
