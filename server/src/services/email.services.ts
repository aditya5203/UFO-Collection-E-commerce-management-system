// server/src/services/email.service.ts
import nodemailer from "nodemailer";
import { AppError } from "../middleware/error.middleware";

type Attachment = {
  filename: string;
  path: string;
  contentType?: string;
};

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[]; // ✅ NEW
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new AppError(
      "Email not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env",
      500
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export const emailService = {
  // ✅ General email sender (now supports attachments)
  async sendMail({ to, subject, html, attachments }: SendMailArgs) {
    const devMode = (process.env.EMAIL_DEV_MODE || "").toLowerCase() === "true";

    // ✅ DEV fallback
    if (devMode) {
      console.log("📩 [EMAIL_DEV_MODE] Email skipped");
      console.log("TO:", to);
      console.log("SUBJECT:", subject);
      console.log("HTML:", html);
      if (attachments?.length) {
        console.log("ATTACHMENTS:", attachments.map((a) => a.filename).join(", "));
      }
      return;
    }

    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    if (!from) throw new AppError("EMAIL_FROM missing in .env", 500);

    const t = getTransporter();

    try {
      const info = await t.sendMail({
        from: `UFO Collection <${from}>`,
        to,
        subject,
        html,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          path: a.path,
          contentType: a.contentType,
        })),
      });

      console.log("✅ Email sent:", info.messageId);
    } catch (err: any) {
      console.error("❌ Email send failed:", err?.message || err);
      throw new AppError("Failed to send email. Check SMTP settings.", 500);
    }
  },

  // ✅ Specialized helper for invoice PDF emails
  async sendInvoiceEmail(opts: {
    to: string;
    customerName: string;
    invoiceNo: string;
    pdfPath: string;
    pdfFileName?: string;
  }) {
    const fileName = opts.pdfFileName || `${opts.invoiceNo}.pdf`;

    return this.sendMail({
      to: opts.to,
      subject: `Your Invoice (${opts.invoiceNo}) - UFO Collection`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>Hi <b>${opts.customerName}</b>,</p>
          <p>Thanks for your order! Your invoice is attached as a PDF.</p>
          <p><b>Invoice No:</b> ${opts.invoiceNo}</p>
          <p>— UFO Collection</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          path: opts.pdfPath,
          contentType: "application/pdf",
        },
      ],
    });
  },
};
