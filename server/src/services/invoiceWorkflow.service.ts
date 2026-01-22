import mongoose from "mongoose";
import { Order } from "../models/Order.model";
import { User } from "../models/User.model";
import { generateInvoicePdf } from "./invoice.service";
import { emailService } from "./email.services";

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

export async function maybeSendInvoiceForOrder(orderIdOrCode: string) {
  // 1) find order by _id or orderCode
  const isObjId = mongoose.Types.ObjectId.isValid(orderIdOrCode);

  const order: any = isObjId
    ? await Order.findById(orderIdOrCode).lean()
    : await Order.findOne({ orderCode: orderIdOrCode }).lean();

  if (!order) return { sent: false, reason: "Order not found" };

  // 2) prevent duplicate sending
  if (order.invoiceSentAt) {
    return { sent: false, reason: "Already sent" };
  }

  // 3) decide when to send
  // COD -> send immediately
  // Online -> send only when Paid
  const shouldSend =
    order.paymentMethod === "COD" ? true : order.paymentStatus === "Paid";

  if (!shouldSend) {
    return { sent: false, reason: "Not eligible yet (Payment not Paid)" };
  }

  // 4) customer info (prefer address snapshot, fallback to User)
  let customerEmail = String(order.address?.email || "").trim();
  let customerPhone = String(order.address?.phone || "").trim();
  let customerName = resolveCustomerName(order);

  if (!customerEmail) {
    const u: any = await User.findById(order.customer)
      .select("email name")
      .lean();

    if (u?.email) customerEmail = String(u.email).trim();
    if (u?.name && customerName === "Customer") customerName = String(u.name).trim();
  }

  if (!customerEmail) {
    return { sent: false, reason: "No customer email found" };
  }

  // 5) invoice no
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(
    order.orderCode
  ).toUpperCase()}`;

  // 6) generate pdf
  const { filePath, fileName } = await generateInvoicePdf({
    invoiceNo,
    orderCode: order.orderCode,
    createdAt: order.createdAt,

    customer: {
      name: customerName,
      email: customerEmail,
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

  // 7) send email (PDF attachment)
  await emailService.sendInvoiceEmail({
    to: customerEmail,
    customerName,
    invoiceNo,
    pdfPath: filePath,
    pdfFileName: fileName,
  });

  // 8) mark as sent
  await Order.updateOne(
    { _id: order._id },
    { $set: { invoiceNo, invoiceSentAt: new Date() } }
  );

  return { sent: true, invoiceNo };
}
