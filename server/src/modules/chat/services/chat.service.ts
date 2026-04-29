import { Types } from "mongoose";
import { ConversationModel } from "../../../models/Conversation.model";
import { MessageModel } from "../../../models/Message.model";
import { User } from "../../../models/User.model";
import { SendMessageDTO } from "../types/chat.types";
import { noAiReply } from "../bot/no-ai";
import { botReply } from "../bot/rivescript";
import { aiReply } from "./ai.service";
import { notificationService } from "../../notifications/services/notification.service";
import { getIO } from "../../../socket";

function cleanText(t: string) {
  return String(t || "").trim().slice(0, 2000);
}

function norm(s: string) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function wantsHumanAgent(text: string) {
  const t = norm(text);
  const keywords = [
    "talk to agent",
    "talk to human",
    "live agent",
    "agent",
    "customer care",
    "support agent",
    "manche sanga kura",
    "agent sanga kura",
    "human",
  ];

  return keywords.some((k) => t === k || t.includes(k));
}

function emitChatMessage(conversationId: string, message: any) {
  try {
    getIO().to(`chat:${conversationId}`).emit("chat:message", {
      conversationId,
      message,
    });
  } catch (e: any) {
    console.log("Socket chat:message emit failed:", e?.message);
  }
}

function emitChatUpdated(conversationId: string, conversation: any) {
  try {
    getIO().to(`chat:${conversationId}`).emit("chat:updated", {
      conversationId,
      conversation,
    });
  } catch (e: any) {
    console.log("Socket chat:updated emit failed:", e?.message);
  }
}

export const chatService = {
  async openForCustomer(userId: string, orderId?: string, forceNew = false) {
    const uid = new Types.ObjectId(userId);

    if (!forceNew) {
      if (orderId) {
        const existing = await ConversationModel.findOne({
          userId: uid,
          orderId,
          status: "OPEN",
        }).lean();

        if (existing) return existing;
      }

      const open = await ConversationModel.findOne({
        userId: uid,
        status: "OPEN",
        ...(orderId ? { orderId } : {}),
      }).lean();

      if (open) return open;
    }

    const created = await ConversationModel.create({
      userId: uid,
      orderId: orderId || null,
      status: "OPEN",
      aiDisabled: false,
    });

    const systemMsg = await MessageModel.create({
      conversationId: created._id,
      senderRole: "system",
      senderId: null,
      text: "Chat started. A support agent will respond soon. (UFO Bot may reply until an agent joins.)",
      isReadByUser: true,
      isReadByAdmin: false,
    });

    emitChatMessage(String(created._id), systemMsg.toObject());

    try {
      const customer: any = await User.findById(userId)
        .select("name email")
        .lean();

      await notificationService.createAdminForAll({
        title: "New live chat opened",
        message: `${
          customer?.name || customer?.email || "Customer"
        } opened a new chat.`,
        type: "chat",
        link: `/admin/chat`,
        meta: {
          conversationId: String(created._id),
          customerId: String(userId),
          customerName: customer?.name || "",
          customerEmail: customer?.email || "",
          orderId: orderId || null,
        },
      });
    } catch (e: any) {
      console.log("Chat open notification failed (ignored):", e?.message);
    }

    return created.toObject();
  },

  async listCustomerConversations(userId: string) {
    return ConversationModel.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ updatedAt: -1 })
      .lean();
  },

  async listAdminConversations() {
    return ConversationModel.find().sort({ updatedAt: -1 }).lean();
  },

  async getMessages(conversationId: string, limit = 50) {
    return MessageModel.find({
      conversationId: new Types.ObjectId(conversationId),
    })
      .sort({ createdAt: 1 })
      .limit(Math.max(1, Math.min(200, limit)))
      .lean();
  },

  async customerSend(
    userId: string,
    conversationId: string,
    dto: SendMessageDTO
  ) {
    const text = cleanText(dto.text);
    if (!text) throw new Error("Message is empty");

    const conv = await ConversationModel.findById(conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (String(conv.userId) !== String(userId)) throw new Error("Forbidden");
    if (conv.status !== "OPEN") throw new Error("Chat ended");

    const userMsg = await MessageModel.create({
      conversationId: conv._id,
      senderRole: "user",
      senderId: new Types.ObjectId(userId),
      text,
      isReadByUser: true,
      isReadByAdmin: false,
    });

    conv.lastMessage = text;
    conv.lastMessageAt = new Date();
    await conv.save();

    emitChatMessage(String(conv._id), userMsg.toObject());

    try {
      const customer: any = await User.findById(userId)
        .select("name email")
        .lean();

      await notificationService.createAdminForAll({
        title: "New chat message",
        message: `${customer?.name || customer?.email || "Customer"} sent: "${text.slice(
          0,
          60
        )}${text.length > 60 ? "..." : ""}"`,
        type: "chat",
        link: `/admin/chat`,
        meta: {
          conversationId: String(conv._id),
          messageId: String(userMsg._id),
          customerId: String(userId),
          customerName: customer?.name || "",
          customerEmail: customer?.email || "",
          preview: text.slice(0, 120),
        },
      });
    } catch (e: any) {
      console.log("Chat message notification failed (ignored):", e?.message);
    }

    if (!conv.adminId && wantsHumanAgent(text)) {
      conv.aiDisabled = true;
      await conv.save();

      const systemMsg = await MessageModel.create({
        conversationId: conv._id,
        senderRole: "system",
        senderId: null,
        text:
          "🔔 Customer requested a human support agent. Please wait — an agent will reply as soon as available.\nTip: If this is about an order, please share your Order ID.",
        isReadByUser: true,
        isReadByAdmin: false,
      });

      emitChatMessage(String(conv._id), systemMsg.toObject());
      emitChatUpdated(String(conv._id), conv.toObject());

      try {
        const customer: any = await User.findById(userId)
          .select("name email")
          .lean();

        await notificationService.createAdminForAll({
          title: "Human agent requested",
          message: `${
            customer?.name || customer?.email || "Customer"
          } requested a human agent.`,
          type: "chat",
          link: `/admin/chat`,
          meta: {
            conversationId: String(conv._id),
            customerId: String(userId),
            customerName: customer?.name || "",
            customerEmail: customer?.email || "",
          },
        });
      } catch (e: any) {
        console.log("Human agent request notification failed (ignored):", e?.message);
      }

      return userMsg.toObject();
    }

    if (!conv.adminId && !conv.aiDisabled) {
      let replyText = "";

      const lastMsgs = await MessageModel.find({
        conversationId: conv._id,
      })
        .sort({ createdAt: -1 })
        .limit(14)
        .lean();

      const history = lastMsgs
        .reverse()
        .filter((m) => m.senderRole !== "system")
        .map((m) => ({
          role:
            m.senderRole === "user"
              ? ("user" as const)
              : ("assistant" as const),
          content: m.text,
        }));

      try {
        replyText = await aiReply(history as any);
      } catch {
        replyText = "";
      }

      if (!replyText) {
        try {
          replyText = await botReply(text, String(userId));
        } catch {
          replyText = "";
        }
      }

      if (!replyText) {
        replyText = noAiReply(text);
      }

      const botMsg = await MessageModel.create({
        conversationId: conv._id,
        senderRole: "bot",
        senderId: null,
        text: replyText,
        isReadByUser: true,
        isReadByAdmin: false,
      });

      conv.lastMessage = replyText;
      conv.lastMessageAt = new Date();
      await conv.save();

      emitChatMessage(String(conv._id), botMsg.toObject());
      emitChatUpdated(String(conv._id), conv.toObject());
    }

    return userMsg.toObject();
  },

  async adminSend(
    adminId: string,
    conversationId: string,
    dto: SendMessageDTO
  ) {
    const text = cleanText(dto.text);
    if (!text) throw new Error("Message is empty");

    const conv = await ConversationModel.findById(conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.status !== "OPEN") throw new Error("Chat ended");

    const isFirstAdminReply = !conv.adminId;

    if (isFirstAdminReply) {
      conv.adminId = new Types.ObjectId(adminId);
      conv.aiDisabled = true;

      const systemMsg = await MessageModel.create({
        conversationId: conv._id,
        senderRole: "system",
        senderId: null,
        text: "👤 A human support agent has joined the chat.",
        isReadByUser: true,
        isReadByAdmin: true,
      });

      emitChatMessage(String(conv._id), systemMsg.toObject());
    }

    const msg = await MessageModel.create({
      conversationId: conv._id,
      senderRole: "admin",
      senderId: new Types.ObjectId(adminId),
      text,
      isReadByUser: false,
      isReadByAdmin: true,
    });

    conv.lastMessage = text;
    conv.lastMessageAt = new Date();
    await conv.save();

    emitChatMessage(String(conv._id), msg.toObject());
    emitChatUpdated(String(conv._id), conv.toObject());

    try {
      const customerId = String(conv.userId || "");

      if (customerId) {
        await notificationService.createCustomer({
          userId: customerId,
          title: "New message from support",
          message: "Support replied to your live chat.",
          type: "chat",
          link: "/notifications",
          meta: {
            conversationId: String(conv._id),
            messageId: String(msg._id),
            adminId: String(adminId),
          },
        });
      }
    } catch (e: any) {
      console.log("Customer live chat notification failed (ignored):", e?.message);
    }

    return msg.toObject();
  },

  async customerEnd(userId: string, conversationId: string) {
    const conv = await ConversationModel.findById(conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (String(conv.userId) !== String(userId)) throw new Error("Forbidden");

    conv.status = "ENDED";
    conv.aiDisabled = true;
    await conv.save();

    const systemMsg = await MessageModel.create({
      conversationId: conv._id,
      senderRole: "system",
      senderId: null,
      text: "Customer ended the chat.",
      isReadByUser: true,
      isReadByAdmin: true,
    });

    emitChatMessage(String(conv._id), systemMsg.toObject());
    emitChatUpdated(String(conv._id), conv.toObject());

    return conv.toObject();
  },

  async adminEnd(adminId: string, conversationId: string) {
    const conv = await ConversationModel.findById(conversationId);
    if (!conv) throw new Error("Conversation not found");

    if (!conv.adminId) {
      conv.adminId = new Types.ObjectId(adminId);
    }

    conv.status = "ENDED";
    conv.aiDisabled = true;
    await conv.save();

    const systemMsg = await MessageModel.create({
      conversationId: conv._id,
      senderRole: "system",
      senderId: null,
      text: "Agent ended the chat.",
      isReadByUser: true,
      isReadByAdmin: true,
    });

    emitChatMessage(String(conv._id), systemMsg.toObject());
    emitChatUpdated(String(conv._id), conv.toObject());

    return conv.toObject();
  },
};