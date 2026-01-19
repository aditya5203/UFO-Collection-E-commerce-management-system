import { Schema, model, Types } from "mongoose";

export type SenderRole = "user" | "admin" | "bot" | "system";

export interface IMessage {
  conversationId: Types.ObjectId;

  senderRole: SenderRole;
  senderId?: Types.ObjectId | null;

  text: string;

  isReadByUser: boolean;
  isReadByAdmin: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    // ✅ IMPORTANT: ref must match Conversation model name "Conversation"
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },

    senderRole: { type: String, enum: ["user", "admin", "bot", "system"], required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    text: { type: String, required: true, trim: true },

    isReadByUser: { type: Boolean, default: false },
    isReadByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel = model<IMessage>("Message", MessageSchema);
