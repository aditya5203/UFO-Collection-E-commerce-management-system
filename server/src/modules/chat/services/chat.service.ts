// server/src/modules/chat/services/chat.service.ts
import { Types } from "mongoose";
import { ConversationModel } from "../../../models/Conversation.model";
import { MessageModel } from "../../../models/Message.model";
import { SendMessageDTO } from "../types/chat.types";
import { noAiReply } from "../bot/no-ai";

function cleanText(t: string) {
  return (t || "").trim().slice(0, 2000);
}

export const chatService = {
  async openForCustomer(userId: string, orderId?: string) {
    const uid = new Types.ObjectId(userId);

    // 1) If orderId -> keep one OPEN conversation per order
    if (orderId) {
      const existing = await ConversationModel.findOne({
        userId: uid,
        orderId,
        status: "OPEN",
      }).lean();
      if (existing) return existing;
    }

    // 2) otherwise one OPEN per user (general support)
    const open = await ConversationModel.findOne({
      userId: uid,
      status: "OPEN",
      ...(orderId ? { orderId } : {}),
    }).lean();

    if (open) return open;

    const created = await ConversationModel.create({
      userId: uid,
      orderId: orderId || null,
      status: "OPEN",
    });

    await MessageModel.create({
      conversationId: created._id,
      senderRole: "system",
      senderId: null,
      text: "Chat started. A support agent will respond soon. (No-AI helper may reply until an agent joins.)",
      isReadByUser: true,
      isReadByAdmin: false,
    });

    return created.toObject();
  },

  async listCustomerConversations(userId: string) {
    return ConversationModel.find({ userId: new Types.ObjectId(userId) })
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

  // ✅ CUSTOMER SEND + NO-AI AUTO REPLY (only if no admin assigned yet)
  async customerSend(userId: string, conversationId: string, dto: SendMessageDTO) {
  const text = cleanText(dto.text);
  if (!text) throw new Error("Message is empty");

  const conv = await ConversationModel.findById(conversationId);
  if (!conv) throw new Error("Conversation not found");
  if (String(conv.userId) !== String(userId)) throw new Error("Forbidden");
  if (conv.status !== "OPEN") throw new Error("Chat ended");

  // 1) Save customer message
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

  // 2) Auto reply ONLY if no admin has joined yet
  if (!conv.adminId) {
    const replyText = noAiReply(text);

    await MessageModel.create({
      conversationId: conv._id,
      senderRole: "system", // keep it system in DB
      senderId: null,
      text: replyText,
      isReadByUser: true,
      isReadByAdmin: false,
    });
  }

  return userMsg.toObject();
},


  // ✅ ADMIN SEND (first admin reply assigns the chat + adds a "human joined" system message)
  async adminSend(adminId: string, conversationId: string, dto: SendMessageDTO) {
    const text = cleanText(dto.text);
    if (!text) throw new Error("Message is empty");

    const conv = await ConversationModel.findById(conversationId);
    if (!conv) throw new Error("Conversation not found");
    if (conv.status !== "OPEN") throw new Error("Chat ended");

    const isFirstAdminReply = !conv.adminId;

    // auto assign agent
    if (isFirstAdminReply) {
      conv.adminId = new Types.ObjectId(adminId);

      await MessageModel.create({
        conversationId: conv._id,
        senderRole: "system",
        senderId: null,
        text: "👤 A human support agent has joined the chat.",
        isReadByUser: true,
        isReadByAdmin: true,
      });
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

    return msg.toObject();
  },

  async endChat(conversationId: string, endedBy: "user" | "admin") {
    const conv = await ConversationModel.findById(conversationId);
    if (!conv) throw new Error("Conversation not found");

    conv.status = "ENDED";
    await conv.save();

    await MessageModel.create({
      conversationId: conv._id,
      senderRole: "system",
      senderId: null,
      text: endedBy === "admin" ? "Agent ended the chat." : "Customer ended the chat.",
      isReadByUser: true,
      isReadByAdmin: true,
    });

    return conv.toObject();
  },
};
