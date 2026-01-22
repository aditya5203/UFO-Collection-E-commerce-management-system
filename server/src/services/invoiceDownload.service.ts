import mongoose from "mongoose";
import { Order } from "../models/Order.model";
import { User } from "../models/User.model";
import { generateInvoicePdf } from "./invoice.service";

function buildAddressText(address: any) {
  if (!address) return "N/A";

  const parts = [
    address.addressLine,
    address.street,
    address.cityOrMunicipality,
    address.district,
    address.provinceId,
    address.country || "Nepal",
    address.postalCode,
  ].filter(Boolean);

  return parts.join(", ");
}

function resolveCustomerName(order: any) {
  const a = order.address;
  if (a?.fullName?.trim()) return a.fullName.trim();
  const fn = [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();
  if (fn) return fn;
  return "Customer";
}

export async function generateInvoicePdfForOrder(orderIdOrCode: string) {
  const isObjId = mongoose.Types.ObjectId.isValid(orderIdOrCode);

  const order: any = isObjId
    ? await Order.findById(orderIdOrCode).lean()
    : await Order.findOne({ orderCode: orderIdOrCode }).lean();

  if (!order) throw new Error("Order not found");

  // customer info
  let customerEmail = String(order.address?.email || "").trim();
  let customerPhone = String(order.address?.phone || "").trim();
  let customerName = resolveCustomerName(order);

  if (!customerEmail) {
    const u: any = await User.findById(order.customer).select("email name").lean();
    if (u?.email) customerEmail = String(u.email).trim();
    if (u?.name && customerName === "Customer") customerName = String(u.name).trim();
  }

  // invoice number (reuse if exists)
  const invoiceNo =
    order.invoiceNo ||
    `INV-${new Date(order.createdAt).getFullYear()}-${String(order.orderCode).toUpperCase()}`;

  const { filePath, fileName } = await generateInvoicePdf({
    invoiceNo,
    orderCode: order.orderCode,
    createdAt: order.createdAt,

    customer: {
      name: customerName,
      email: customerEmail || "N/A",
      phone: customerPhone || "N/A",
    },

    addressText: buildAddressText(order.address),

    items: (order.items || []).map((it: any) => ({
      name: it.name,
      size: it.size || "",
      qty: Number(it.qty || 0),
      pricePaisa: Number(it.pricePaisa || 0),
    })),

    subtotalPaisa: Number(order.subtotalPaisa || 0),
    discountPaisa: Number(order.discountPaisa || 0),
    shippingPaisa: Number(order.shippingPaisa || 0),
    totalPaisa: Number(order.totalPaisa || 0),

    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentRef: order.paymentRef || null,
  });

  // store invoiceNo if missing (optional)
  if (!order.invoiceNo) {
    await Order.updateOne({ _id: order._id }, { $set: { invoiceNo } });
  }

  return { filePath, fileName, invoiceNo, orderId: String(order._id), orderCode: order.orderCode };
}
