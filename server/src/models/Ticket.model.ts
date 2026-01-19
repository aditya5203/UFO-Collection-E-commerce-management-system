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
    ticketCode: { type: String, required: true, unique: true }, // "#12345"
    status: {
      type: String,
      enum: ["Open", "Pending", "Closed"],
      default: "Open",
    },

    issueType: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    // optional references
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },

    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true },

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
