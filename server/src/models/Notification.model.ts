import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationAudience = "customer" | "admin" | "delivery";

export type NotificationType =
  | "order"
  | "payment"
  | "stock"
  | "ticket"
  | "chat"
  | "promo"
  | "user"
  | "review"
  | "system"
  | "offer"
  | "product"
  | "account";

export interface INotification extends Document {
  user: Types.ObjectId;
  audience: NotificationAudience;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  meta?: Record<string, any>;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    audience: {
      type: String,
      enum: ["customer", "admin", "delivery"],
      default: "customer",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "order",
        "payment",
        "stock",
        "ticket",
        "chat",
        "promo",
        "user",
        "review",
        "system",
        "offer",
        "product",
        "account",
      ],
      default: "system",
      index: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, audience: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, audience: 1, isRead: 1 });
NotificationSchema.index({ audience: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ audience: 1, expiresAt: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);