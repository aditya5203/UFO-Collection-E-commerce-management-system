import mongoose from "mongoose";
import { Ticket } from "../../../models/Ticket.model";

function makeTicketCode() {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `#${n}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type TicketStatus =
  | "Open"
  | "Pending"
  | "In Progress"
  | "Resolved"
  | "Closed";

export const ticketService = {
  async createTicket(input: {
    customerId?: string | null;
    issueType: string;
    subject: string;
    message: string;
    customerName: string;
    customerEmail: string;
    orderId?: string | null;
    productId?: string | null;
    productName?: string | null;
    size?: string | null;
    color?: string | null;
    imageUrl?: string | null;
  }) {
    let code = makeTicketCode();

    for (let i = 0; i < 10; i++) {
      const exists = await Ticket.findOne({ ticketCode: code }).lean();
      if (!exists) break;
      code = makeTicketCode();
    }

    const customerObjId =
      input.customerId && mongoose.Types.ObjectId.isValid(input.customerId)
        ? new mongoose.Types.ObjectId(input.customerId)
        : null;

    const productObjId =
      input.productId && mongoose.Types.ObjectId.isValid(input.productId)
        ? new mongoose.Types.ObjectId(input.productId)
        : null;

    return Ticket.create({
      ticketCode: code,
      status: "Open",
      issueType: input.issueType,
      subject: input.subject,
      message: input.message,
      customer: customerObjId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      orderId: input.orderId || null,
      productId: productObjId,
      productName: input.productName || null,
      size: input.size || null,
      color: input.color || null,
      imageUrl: input.imageUrl || null,
      replies: [],
    });
  },

  async listAdminTickets(
    q?: string,
    customerId?: string,
    customerEmail?: string
  ) {
    const s = (q || "").trim();
    const filter: any = {};

    const customerFilters: any[] = [];

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      customerFilters.push({
        customer: new mongoose.Types.ObjectId(customerId),
      });
    }

    const email = String(customerEmail || "").trim();

    if (email) {
      customerFilters.push({
        customerEmail: new RegExp(`^${escapeRegex(email)}$`, "i"),
      });
    }

    if (customerFilters.length === 1) {
      Object.assign(filter, customerFilters[0]);
    }

    if (customerFilters.length > 1) {
      filter.$or = customerFilters;
    }

    if (s) {
      const searchOr = [
        { ticketCode: new RegExp(s, "i") },
        { customerName: new RegExp(s, "i") },
        { customerEmail: new RegExp(s, "i") },
        { subject: new RegExp(s, "i") },
        { issueType: new RegExp(s, "i") },
        { status: new RegExp(s, "i") },
        { productName: new RegExp(s, "i") },
        { orderId: new RegExp(s, "i") },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    return Ticket.find(filter).sort({ createdAt: -1 }).lean();
  },

  async getAdminTicketById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Ticket.findById(id).lean();
  },

  async updateStatus(id: string, status: TicketStatus) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Ticket.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },

  async addAdminReply(id: string, text: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Ticket.findByIdAndUpdate(
      id,
      {
        $push: { replies: { sender: "admin", text } },
        $set: { status: "In Progress" },
      },
      { new: true }
    ).lean();
  },

  async listCustomerTicketsByEmail(email: string) {
    return Ticket.find({ customerEmail: email }).sort({ createdAt: -1 }).lean();
  },

  async getCustomerTicketByIdAndEmail(id: string, email: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Ticket.findOne({ _id: id, customerEmail: email }).lean();
  },

  async addCustomerReply(id: string, email: string, text: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return Ticket.findOneAndUpdate(
      { _id: id, customerEmail: email },
      {
        $push: { replies: { sender: "customer", text } },
        $set: { status: "Open" },
      },
      { new: true }
    ).lean();
  },
};