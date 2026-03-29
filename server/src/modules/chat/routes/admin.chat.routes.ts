import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const router = Router();

/**
 * BASE: /api/admin/chat
 * adminAuthMiddleware + authorize("admin", "superadmin")
 * already applied in routes/index.ts
 */

// View all conversations
router.get(
  "/conversations",
  authorizePermission("liveChatView"),
  chatController.adminList
);

// View messages of one conversation
router.get(
  "/conversations/:conversationId/messages",
  authorizePermission("liveChatView"),
  chatController.messages
);

// Reply to a conversation
router.post(
  "/conversations/:conversationId/messages",
  authorizePermission("liveChatReply"),
  chatController.adminSend
);

// End a conversation
router.patch(
  "/conversations/:conversationId/end",
  authorizePermission("liveChatReply"),
  chatController.adminEnd
);

export default router;