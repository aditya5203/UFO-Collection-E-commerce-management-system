import crypto from "crypto";
import { emailService } from "./email.services";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createInviteToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

export function hashInviteToken(token: string) {
  return sha256(token);
}

function escapeHtml(input: string) {
  return String(input || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendAdminInviteEmail(params: {
  to: string;
  name: string;
  invitedByName?: string;
  token: string;
}) {
  const clientBase = process.env.CLIENT_BASE_URL || "http://localhost:3000";
  const inviteUrl = `${clientBase}/accept-invite?token=${encodeURIComponent(
    params.token
  )}`;

  await emailService.sendMail({
    to: params.to,
    subject: "You’ve been invited as an Admin – UFO Collection",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Admin Invitation</h2>
        <p>Hello <strong>${escapeHtml(params.name || "Admin")}</strong>,</p>
        <p>
          You have been invited to join <strong>UFO Collection</strong> as an <strong>Admin</strong>${
            params.invitedByName
              ? ` by <strong>${escapeHtml(params.invitedByName)}</strong>`
              : ""
          }.
        </p>
        <p>Please click the button below to activate your account and set your password.</p>
        <p>
          <a href="${inviteUrl}"
             style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">
            Accept Invitation
          </a>
        </p>
        <p><strong>Role:</strong> Admin</p>
        <p>This invitation link will expire in 24 hours.</p>
        <p>For security reasons, do not share this link with anyone.</p>
        <p>After setting your password, you can log in to the admin panel.</p>
        <p>Regards,<br/><strong>UFO Collection Team</strong></p>
      </div>
    `,
  });
}

export async function sendDeliveryInviteEmail(params: {
  to: string;
  name: string;
  invitedByName?: string;
  token: string;
}) {
  const clientBase = process.env.CLIENT_BASE_URL || "http://localhost:3000";
  const inviteUrl = `${clientBase}/accept-invite?token=${encodeURIComponent(
    params.token
  )}`;

  await emailService.sendMail({
    to: params.to,
    subject: "You’ve been invited as Delivery Staff – UFO Collection",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Delivery Staff Invitation</h2>
        <p>Hello <strong>${escapeHtml(params.name || "Delivery Staff")}</strong>,</p>
        <p>
          You have been invited to join <strong>UFO Collection</strong> as <strong>Delivery Staff</strong>${
            params.invitedByName
              ? ` by <strong>${escapeHtml(params.invitedByName)}</strong>`
              : ""
          }.
        </p>
        <p>Please click the button below to activate your account and set your password.</p>
        <p>
          <a href="${inviteUrl}"
             style="display:inline-block;padding:12px 18px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">
            Accept Invitation
          </a>
        </p>
        <p><strong>Role:</strong> Delivery Staff</p>
        <p>This invitation link will expire in 24 hours.</p>
        <p>For security reasons, do not share this link with anyone.</p>
        <p>After setting your password, you can log in to the delivery panel.</p>
        <p>Regards,<br/><strong>UFO Collection Team</strong></p>
      </div>
    `,
  });
}