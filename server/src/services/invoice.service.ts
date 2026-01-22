// server/src/services/invoice.service.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export type InvoiceItem = {
  name: string;
  size?: string;
  qty: number;
  pricePaisa: number;
};

export type InvoiceData = {
  invoiceNo: string;
  orderCode: string;
  createdAt: Date;

  customer: {
    name: string;
    email: string;
    phone: string;
  };

  addressText: string;

  items: InvoiceItem[];

  subtotalPaisa: number;
  discountPaisa: number;
  shippingPaisa: number;
  totalPaisa: number;

  paymentMethod: string;
  paymentStatus: string;
  paymentRef?: string | null;
};

function moneyFromPaisa(paisa: number) {
  const n = Number(paisa || 0) / 100;
  return `NPR ${n.toFixed(2)}`;
}

export async function generateInvoicePdf(data: InvoiceData) {
  const invoicesDir = path.join(process.cwd(), "tmp", "invoices");
  fs.mkdirSync(invoicesDir, { recursive: true });

  const fileName = `${data.invoiceNo}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ---------------- WATERMARK (FADED LOGO CENTER) ✅ ----------------
  const logoPath = path.join(process.cwd(), "public", "assets", "ufo-logo.png");
  if (fs.existsSync(logoPath)) {
    const wmSize = 380;
    const wmX = (doc.page.width - wmSize) / 2;
    const wmY = (doc.page.height - wmSize) / 2;

    doc.save();
    doc.opacity(0.08); // fade strength
    doc.image(logoPath, wmX, wmY, { width: wmSize });
    doc.opacity(1);
    doc.restore();
  }

  // ---------------- LOGO + BRAND (LEFT) ----------------
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 70 });
  }

  doc.fillColor("#000").fontSize(20).text("UFO Collection", 140, 50);

  doc
    .fontSize(10)
    .fillColor("#444")
    .text("Kathmandu, Nepal", 140, 75)
    .text("Email: support@ufocollection.com", 140, 90)
    .text("Phone: +977-98XXXXXXXX", 140, 105);

  // ---------------- INVOICE (RIGHT) ----------------
  doc.fillColor("#000").fontSize(18).text("INVOICE", 350, 50, { align: "right" });

  doc
    .fontSize(10)
    .fillColor("#000")
    .text(`Invoice No: ${data.invoiceNo}`, 350, 75, { align: "right" })
    .text(`Order Code: ${data.orderCode}`, 350, 90, { align: "right" })
    .text(`Date: ${new Date(data.createdAt).toDateString()}`, 350, 105, {
      align: "right",
    });

  // line
  doc.moveDown(4);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();

  // ---------------- CUSTOMER + ADDRESS ----------------
  const startY = doc.y;

  doc.fillColor("#000").fontSize(12).text("Billed To:", 50, startY);
  doc
    .fontSize(10)
    .fillColor("#333")
    .text(data.customer.name || "Customer", 50, startY + 18)
    .text(data.customer.email || "N/A", 50, startY + 34)
    .text(data.customer.phone || "N/A", 50, startY + 50);

  doc.fillColor("#000").fontSize(12).text("Shipping Address:", 320, startY);
  doc
    .fontSize(10)
    .fillColor("#333")
    .text(data.addressText || "N/A", 320, startY + 18, { width: 220 });

  doc.moveDown(5);

  // ---------------- ITEMS TABLE ----------------
  const tableTop = doc.y;
  const cols = { item: 50, variant: 280, price: 390, qty: 450, total: 500 };

  doc.fillColor("#000").fontSize(10);
  doc.text("Item", cols.item, tableTop);
  doc.text("Variant", cols.variant, tableTop);
  doc.text("Price", cols.price, tableTop, { width: 80, align: "right" });
  doc.text("Qty", cols.qty, tableTop, { width: 40, align: "right" });
  doc.text("Total", cols.total, tableTop, { width: 80, align: "right" });

  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

  let y = tableTop + 25;

  for (const it of data.items) {
    const variant = it.size ? `Size: ${it.size}` : "-";
    const lineTotalPaisa = (it.pricePaisa || 0) * (it.qty || 0);

    doc.fillColor("#111").fontSize(10);
    doc.text(it.name, cols.item, y, { width: 220 });

    doc.fillColor("#333");
    doc.text(variant, cols.variant, y, { width: 100 });

    // ✅ wider widths so currency never wraps
    doc.text(moneyFromPaisa(it.pricePaisa), cols.price, y, {
      width: 80,
      align: "right",
      lineBreak: false,
    });

    doc.text(String(it.qty), cols.qty, y, {
      width: 40,
      align: "right",
      lineBreak: false,
    });

    doc.text(moneyFromPaisa(lineTotalPaisa), cols.total, y, {
      width: 80,
      align: "right",
      lineBreak: false,
    });

    y += 18;

    if (y > 720) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();

  // ---------------- TOTALS (FIXED ALIGNMENT) ----------------
  const labelX = 340;
  const amountX = 445;
  const amountW = 100;
  let ty = y + 20;

  doc.fillColor("#000").fontSize(10);

  doc.text("Subtotal:", labelX, ty);
  doc.text(moneyFromPaisa(data.subtotalPaisa), amountX, ty, {
    width: amountW,
    align: "right",
    lineBreak: false,
  });

  ty += 15;
  doc.text("Discount:", labelX, ty);
  doc.text(`- ${moneyFromPaisa(data.discountPaisa)}`, amountX, ty, {
    width: amountW,
    align: "right",
    lineBreak: false,
  });

  ty += 15;
  doc.text("Shipping:", labelX, ty);
  doc.text(moneyFromPaisa(data.shippingPaisa), amountX, ty, {
    width: amountW,
    align: "right",
    lineBreak: false,
  });

  ty += 18;
  doc.fontSize(12).text("Grand Total:", labelX, ty);
  doc.text(moneyFromPaisa(data.totalPaisa), amountX, ty, {
    width: amountW,
    align: "right",
    lineBreak: false,
  });

  // ---------------- PAYMENT DETAILS (RIGHT SIDE) ----------------
  const paymentY = ty + 70;
  doc.fillColor("#000").fontSize(11).text("Payment Details:", labelX, paymentY);

  doc
    .fontSize(10)
    .fillColor("#333")
    .text(`Method: ${data.paymentMethod}`, labelX, paymentY + 18)
    .text(`Status: ${data.paymentStatus}`, labelX, paymentY + 34);

  if (data.paymentRef) {
    doc.text(`Ref: ${data.paymentRef}`, labelX, paymentY + 50);
  }

  // Footer note
  doc
    .fontSize(9)
    .fillColor("#666")
    .text("Note: This is a system-generated invoice.", labelX, 740, {
      width: 200,
    });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return { filePath, fileName };
}
