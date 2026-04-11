//server/src/modules/chat/routes/chat.routes.ts
import { Router } from "express";
import { chatController } from "../controllers/chat.controller";

const router = Router();

// customerAuthMiddleware already applied in routes/index.ts

// Open chat
router.post("/open", chatController.open);

// My conversations
router.get("/mine", chatController.mine);

// Get messages
router.get("/:conversationId/messages", chatController.messages);

// Customer send message
router.post("/:conversationId/messages", chatController.customerSend);

// Customer end chat
router.patch("/:conversationId/end", chatController.customerEnd);

export default router;