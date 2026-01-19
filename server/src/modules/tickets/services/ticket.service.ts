import mongoose from "mongoose";
import { Ticket } from "../../../models/Ticket.model";

function makeTicketCode() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `#${n}`;
}

export type TicketStatus = "Open" | "Pending" | "Closed";

export const ticketService = {
  async createTicket(input: {
    issueType: string;
    subject: string;
    message: string;
    customerName: string;
    customerEmail: string;
    productId?: string | null;
    imageUrl?: string | null;
  }) {
    let code = makeTicketCode();

    // try to avoid unique collision
    for (let i = 0; i < 10; i++) {
      const exists = await Ticket.findOne({ ticketCode: code }).lean();
      if (!exists) break;
      code = makeTicketCode();
    }

    const doc = await Ticket.create({
      ticketCode: code,
      status: "Open",
      issueType: input.issueType,
      subject: input.subject,
      message: input.message,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      productId: input.productId
        ? new mongoose.Types.ObjectId(input.productId)
        : null,
      imageUrl: input.imageUrl || null,
      replies: [],
    });

    return doc;
  },

  // ---------------------------
  // ADMIN
  // ---------------------------
  async listAdminTickets(q?: string) {
    const s = (q || "").trim();
    const filter: any = {};

    if (s) {
      filter.$or = [
        { ticketCode: new RegExp(s, "i") },
        { customerName: new RegExp(s, "i") },
        { customerEmail: new RegExp(s, "i") },
        { subject: new RegExp(s, "i") },
        { issueType: new RegExp(s, "i") },
        { status: new RegExp(s, "i") },
      ];
    }

    return Ticket.find(filter).sort({ createdAt: -1 }).lean();
  },

  async getAdminTicketById(id: string) {
    return Ticket.findById(id).lean();
  },

  async updateStatus(id: string, status: TicketStatus) {
    return Ticket.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },

  async addAdminReply(id: string, text: string) {
    return Ticket.findByIdAndUpdate(
      id,
      { $push: { replies: { sender: "admin", text } } },
      { new: true }
    ).lean();
  },

  // ---------------------------
  // CUSTOMER (see admin replies)
  // ---------------------------
  async listCustomerTicketsByEmail(email: string) {
    return Ticket.find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .lean();
  },

  async getCustomerTicketByIdAndEmail(id: string, email: string) {
    return Ticket.findOne({ _id: id, customerEmail: email }).lean();
  },

  async addCustomerReply(id: string, email: string, text: string) {
    // ensures customer can only reply on their own ticket
    return Ticket.findOneAndUpdate(
      { _id: id, customerEmail: email },
      { $push: { replies: { sender: "customer", text } } },
      { new: true }
    ).lean();
  },
};
