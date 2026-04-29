import mongoose, { Schema, InferSchemaType } from "mongoose";

const ReplySchema = new Schema(
  {
    sender: { type: String, enum: ["customer", "admin"], required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const TicketSchema = new Schema(
  {
    ticketCode: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["Open", "Pending", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },

    issueType: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    orderId: { type: String, default: null, trim: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, default: null, trim: true },
    size: { type: String, default: null, trim: true },
    color: { type: String, default: null, trim: true },

    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, index: true },

    imageUrl: { type: String, default: null },

    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true }
);

export type TicketDoc = InferSchemaType<typeof TicketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Ticket =
  mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);