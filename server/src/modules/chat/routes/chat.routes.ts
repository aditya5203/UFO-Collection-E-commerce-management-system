import { Router } from "express";
import { chatController } from "../controllers/chat.controller";

const router = Router();

// (customerAuthMiddleware applied in routes/index.ts)

// POST /api/chat/open
router.post("/open", chatController.open);

// GET /api/chat/mine
router.get("/mine", chatController.mine);

// GET /api/chat/:conversationId/messages
router.get("/:conversationId/messages", chatController.messages);

// POST /api/chat/:conversationId/messages
router.post("/:conversationId/messages", chatController.customerSend);

// PATCH /api/chat/:conversationId/end
router.patch("/:conversationId/end", chatController.customerEnd);

export default router;
