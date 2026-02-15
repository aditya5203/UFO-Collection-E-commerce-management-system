// server/src/models/Conversation.model.ts
import { Schema, model, Types } from "mongoose";

export type ConversationStatus = "OPEN" | "ENDED";

export interface IConversation {
  userId: Types.ObjectId;
  adminId?: Types.ObjectId | null;

  status: ConversationStatus;
  orderId?: string | null;

  // ✅ NEW: if customer requests human agent, disable bot/AI replies
  aiDisabled?: boolean;

  lastMessage?: string;
  lastMessageAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    status: { type: String, enum: ["OPEN", "ENDED"], default: "OPEN" },
    orderId: { type: String, default: null },

    // ✅ NEW
    aiDisabled: { type: Boolean, default: false },

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
ConversationSchema.index({ adminId: 1, status: 1, updatedAt: -1 });
ConversationSchema.index({ orderId: 1 });

export const ConversationModel = model<IConversation>(
  "Conversation",
  ConversationSchema
);
