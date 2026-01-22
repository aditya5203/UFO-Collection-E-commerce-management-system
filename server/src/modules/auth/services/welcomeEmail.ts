import { emailService } from "../../../services/email.services";

export async function sendWelcomeEmail(to: string, name: string) {
  const clientBase = process.env.CLIENT_BASE_URL || "http://localhost:3000";

  const subject = "Welcome to UFO Collection";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>Welcome to UFO Collection</h2>

      <p>Dear <strong>${name || "Customer"}</strong>,</p>

      <p>
        We’re delighted to welcome you to <strong>UFO Collection</strong>.
      </p>

      <p>
        Your account has been successfully created, and you can now explore our full
        range of products, curated collections, and exclusive features designed to
        enhance your shopping experience.
      </p>

      <p>
        <a href="${clientBase}/collection"
           style="display:inline-block;padding:10px 16px;background:#b49cff;color:#070818;text-decoration:none;border-radius:999px">
          Explore Collection
        </a>
      </p>

      <p>
        If you need any assistance, our support team is always here to help.
      </p>

      <p>
        Thank you for choosing UFO Collection.
      </p>

      <p style="margin-top:18px">
        Kind regards,<br/>
        <strong>UFO Collection Team</strong>
      </p>

      <hr style="margin-top:24px;border:none;border-top:1px solid #ddd"/>
      <p style="font-size:12px;color:#666">© 2025 UFO Collection. All rights reserved.</p>
    </div>
  `;

  await emailService.sendMail({ to, subject, html });
}
