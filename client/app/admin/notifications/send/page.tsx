"use client";

import * as React from "react";
import Link from "next/link";
import AdminPageGuard from "../../_components/AdminPageGuard";

type NotificationType = "offer" | "product" | "account" | "system";

type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  count?: number;
  emailSent?: number;
  emailFailed?: number;
  data?: T;
  items?: T;
};

type BroadcastHistoryItem = {
  broadcastId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  createdAt?: string;
  expiresAt?: string | null;
  sentCount?: number;
  isExpired?: boolean;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const TYPE_OPTIONS: Array<{
  value: NotificationType;
  label: string;
  hint: string;
  validity: string;
  autoLink: string;
}> = [
  {
    value: "offer",
    label: "Offer",
    hint: "Discounts, coupons, free shipping, sale campaigns",
    validity: "Auto-expires in 3 days",
    autoLink: "/homepage",
  },
  {
    value: "product",
    label: "Product",
    hint: "New arrivals, restocks, limited stock alerts",
    validity: "Auto-expires in 5 days",
    autoLink: "/collection",
  },
  {
    value: "account",
    label: "Account",
    hint: "Profile/account related updates for customers",
    validity: "No auto-expiry",
    autoLink: "/profile",
  },
  {
    value: "system",
    label: "System",
    hint: "Maintenance, downtime, general announcements",
    validity: "Auto-expires in 1 day",
    autoLink: "/homepage",
  },
];

async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function getTypePreviewColor(type: NotificationType) {
  switch (type) {
    case "offer":
      return "border-[#14532d] bg-[#052e16] text-[#86efac]";
    case "product":
      return "border-[#1e3a8a] bg-[#0f172a] text-[#93c5fd]";
    case "account":
      return "border-[#5b21b6] bg-[#1e1b4b] text-[#c4b5fd]";
    case "system":
    default:
      return "border-[#374151] bg-[#111827] text-[#d1d5db]";
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);

  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function AdminSendNotificationsPage() {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<NotificationType>("offer");
  const [link, setLink] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [sentCount, setSentCount] = React.useState<number | null>(null);
  const [emailSentCount, setEmailSentCount] = React.useState<number | null>(
    null
  );
  const [emailFailedCount, setEmailFailedCount] = React.useState<number | null>(
    null
  );

  const [history, setHistory] = React.useState<BroadcastHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  const selectedTypeMeta = React.useMemo(
    () => TYPE_OPTIONS.find((item) => item.value === type),
    [type]
  );

  const previewLink = link.trim() || selectedTypeMeta?.autoLink || "/homepage";

  const fetchHistory = React.useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const res = await fetch(
        `${API_BASE_URL}/api/notifications/admin/broadcast-history?limit=12`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      if (res.status === 401) {
        window.location.href = "/admin/adminlogin";
        return;
      }

      if (res.status === 403) {
        setHistory([]);
        setHistoryError("You do not have permission to view notification history.");
        return;
      }

      const json = await safeJson<ApiResponse<BroadcastHistoryItem[]>>(res);

      if (!res.ok) {
        setHistory([]);
        setHistoryError(json?.message || "Failed to load send history.");
        return;
      }

      const list = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
          ? json.data
          : [];

      setHistory(list);
    } catch (e: any) {
      setHistoryError(e?.message || "Failed to load send history.");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const resetForm = React.useCallback(() => {
    setTitle("");
    setMessage("");
    setType("offer");
    setLink("");
    setSendEmail(false);
    setError(null);
    setSuccess(null);
    setSentCount(null);
    setEmailSentCount(null);
    setEmailFailedCount(null);
  }, []);

  const fillOfferExample = React.useCallback(() => {
    setType("offer");
    setTitle("Flat 20% off on all jackets");
    setMessage(
      "Limited-time deal. Shop now and enjoy 20% discount on all jackets before the offer ends."
    );
    setLink("");
    setError(null);
    setSuccess(null);
  }, []);

  const fillProductExample = React.useCallback(() => {
    setType("product");
    setTitle("New arrivals added in Men’s Collection");
    setMessage(
      "Fresh new styles are now live in the Men’s Collection. Explore the latest arrivals today."
    );
    setLink("");
    setError(null);
    setSuccess(null);
  }, []);

  const fillSystemExample = React.useCallback(() => {
    setType("system");
    setTitle("System maintenance tonight at 11 PM");
    setMessage(
      "The website may be temporarily unavailable during scheduled maintenance tonight from 11 PM."
    );
    setLink("");
    setError(null);
    setSuccess(null);
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const cleanTitle = title.trim();
      const cleanMessage = message.trim();
      const cleanLink = link.trim();

      setError(null);
      setSuccess(null);
      setSentCount(null);
      setEmailSentCount(null);
      setEmailFailedCount(null);

      if (!cleanTitle) return setError("Title is required.");
      if (cleanTitle.length < 3) {
        return setError("Title must be at least 3 characters.");
      }

      if (!cleanMessage) return setError("Message is required.");
      if (cleanMessage.length < 5) {
        return setError("Message must be at least 5 characters.");
      }

      if (cleanLink && !cleanLink.startsWith("/")) {
        return setError("Link must start with / . Example: /collection or /profile");
      }

      try {
        setSubmitting(true);

        const res = await fetch(
          `${API_BASE_URL}/api/notifications/admin/broadcast`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: cleanTitle,
              message: cleanMessage,
              type,
              link: cleanLink,
              sendEmail,
            }),
          }
        );

        if (res.status === 401) {
          window.location.href = "/admin/adminlogin";
          return;
        }

        const json = await safeJson<ApiResponse<any[]>>(res);

        if (res.status === 403) {
          setError(
            json?.message ||
              "You do not have permission to send notifications. Ask Superadmin to enable Notification Send permission."
          );
          return;
        }

        if (!res.ok || !json?.success) {
          setError(json?.message || "Failed to send notification.");
          return;
        }

        const count =
          typeof json?.count === "number"
            ? json.count
            : Array.isArray(json?.data)
              ? json.data.length
              : null;

        setSentCount(count);
        setEmailSentCount(
          typeof json?.emailSent === "number" ? json.emailSent : null
        );
        setEmailFailedCount(
          typeof json?.emailFailed === "number" ? json.emailFailed : null
        );

        const successParts = ["Notification sent successfully to customer users."];

        if (sendEmail) {
          successParts.push(
            `Emails sent: ${
              typeof json?.emailSent === "number" ? json.emailSent : 0
            }.`
          );

          if ((json?.emailFailed || 0) > 0) {
            successParts.push(`Email failed: ${json?.emailFailed}.`);
          }
        }

        setSuccess(successParts.join(" "));

        setTitle("");
        setMessage("");
        setLink("");
        setType("offer");
        setSendEmail(false);

        fetchHistory();
      } catch (err: any) {
        setError(err?.message || "Failed to send notification.");
      } finally {
        setSubmitting(false);
      }
    },
    [title, message, type, link, sendEmail, fetchHistory]
  );

  return (
    <AdminPageGuard permission="notificationSend">
      <div className="min-h-full bg-transparent text-white">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white">
                Send Notifications
              </h1>
              <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#94a3b8]">
                Broadcast offer, product, account, or system notifications to all
                customer users. Expiry is automatic by type, and you can also send
                the same message by email.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/notifications"
                className="rounded-xl border border-[#1f2937] bg-[#0f172a] px-4 py-2 text-[13px] font-medium text-[#cbd5e1] transition hover:border-[#334155] hover:text-white"
              >
                View Admin Inbox
              </Link>

              <Link
                href="/admin/dashboard"
                className="rounded-xl border border-[#1f2937] bg-[#0f172a] px-4 py-2 text-[13px] font-medium text-[#cbd5e1] transition hover:border-[#334155] hover:text-white"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="rounded-[24px] border border-[#111827] bg-[#020617] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[13px] font-medium text-[#cbd5e1]">
                        Notification Type
                      </label>

                      <div className="grid gap-3 md:grid-cols-2">
                        {TYPE_OPTIONS.map((option) => {
                          const active = option.value === type;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setType(option.value)}
                              className={`rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-[#16a34a] bg-[#052e16]"
                                  : "border-[#1f2937] bg-[#0b1220] hover:border-[#334155]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-[14px] font-semibold text-white">
                                  {option.label}
                                </div>
                                {active && (
                                  <span className="rounded-full bg-[#16a34a]/20 px-2 py-1 text-[11px] font-semibold text-[#86efac]">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-[12px] leading-5 text-[#94a3b8]">
                                {option.hint}
                              </p>
                              <p className="mt-2 text-[11px] text-[#64748b]">
                                {option.validity}
                              </p>
                              <p className="mt-1 text-[11px] text-[#93c5fd]">
                                Auto link: {option.autoLink}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="notification-title"
                        className="mb-2 block text-[13px] font-medium text-[#cbd5e1]"
                      >
                        Title
                      </label>
                      <input
                        id="notification-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Flat 20% off on all jackets"
                        maxLength={120}
                        className="w-full rounded-2xl border border-[#1f2937] bg-[#0b1220] px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-[#64748b] focus:border-[#16a34a]"
                      />
                      <div className="mt-2 text-right text-[11px] text-[#64748b]">
                        {title.length}/120
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="notification-message"
                        className="mb-2 block text-[13px] font-medium text-[#cbd5e1]"
                      >
                        Message
                      </label>
                      <textarea
                        id="notification-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a clear message that customers will understand immediately."
                        rows={6}
                        maxLength={500}
                        className="w-full resize-none rounded-2xl border border-[#1f2937] bg-[#0b1220] px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-[#64748b] focus:border-[#16a34a]"
                      />
                      <div className="mt-2 text-right text-[11px] text-[#64748b]">
                        {message.length}/500
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="notification-link"
                        className="mb-2 block text-[13px] font-medium text-[#cbd5e1]"
                      >
                        Link <span className="text-[#64748b]">(optional)</span>
                      </label>
                      <input
                        id="notification-link"
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder={`Leave empty for auto link (${
                          selectedTypeMeta?.autoLink || "/homepage"
                        })`}
                        className="w-full rounded-2xl border border-[#1f2937] bg-[#0b1220] px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-[#64748b] focus:border-[#16a34a]"
                      />
                      <p className="mt-2 text-[12px] text-[#64748b]">
                        Leave empty to auto-generate by type. Current fallback:{" "}
                        <code>{selectedTypeMeta?.autoLink || "/homepage"}</code>
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 rounded-2xl border border-[#1f2937] bg-[#0b1220] px-4 py-3">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="text-[14px] font-medium text-white">
                            Send email also
                          </div>
                          <div className="text-[12px] text-[#94a3b8]">
                            Customers will receive the same message by email with
                            the same destination link.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-[#7f1d1d] bg-[#450a0a] px-4 py-3 text-[13px] text-[#fecaca]">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-2xl border border-[#14532d] bg-[#052e16] px-4 py-3 text-[13px] text-[#bbf7d0]">
                      {success}
                      {typeof sentCount === "number"
                        ? ` Notifications: ${sentCount}.`
                        : ""}
                      {typeof emailSentCount === "number"
                        ? ` Emails sent: ${emailSentCount}.`
                        : ""}
                      {typeof emailFailedCount === "number" && emailFailedCount > 0
                        ? ` Email failed: ${emailFailedCount}.`
                        : ""}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-[#16a34a] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Sending..." : "Send Notification"}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="rounded-2xl border border-[#1f2937] bg-[#0b1220] px-5 py-3 text-[14px] font-medium text-[#cbd5e1] transition hover:border-[#334155] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-[24px] border border-[#111827] bg-[#020617] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-semibold text-white">
                      Recently Sent Notifications
                    </h2>
                    <p className="mt-1 text-[13px] text-[#94a3b8]">
                      Latest broadcast campaigns sent to customer users.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchHistory}
                    className="rounded-xl border border-[#1f2937] bg-[#0b1220] px-4 py-2 text-[12px] font-medium text-[#cbd5e1] hover:border-[#334155] hover:text-white"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-5">
                  {historyLoading ? (
                    <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] px-4 py-6 text-[13px] text-[#94a3b8]">
                      Loading history...
                    </div>
                  ) : historyError ? (
                    <div className="rounded-2xl border border-[#7f1d1d] bg-[#450a0a] px-4 py-6 text-[13px] text-[#fecaca]">
                      {historyError}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] px-4 py-6 text-[13px] text-[#94a3b8]">
                      No sent broadcast notifications yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.broadcastId}
                          className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-[14px] font-semibold text-white">
                                  {item.title || "Notification"}
                                </div>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${getTypePreviewColor(
                                    item.type
                                  )}`}
                                >
                                  {item.type}
                                </span>

                                {item.isExpired ? (
                                  <span className="rounded-full border border-[#7f1d1d] bg-[#450a0a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#fecaca]">
                                    expired
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-[#14532d] bg-[#052e16] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#bbf7d0]">
                                    active
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-[13px] leading-6 text-[#94a3b8]">
                                {item.message || ""}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                                <span>Sent {timeAgo(item.createdAt)}</span>
                                <span>•</span>
                                <span>{formatDateTime(item.createdAt)}</span>
                                <span>•</span>
                                <span>Users: {item.sentCount || 0}</span>
                                <span>•</span>
                                <span>
                                  Expires:{" "}
                                  {item.expiresAt
                                    ? formatDateTime(item.expiresAt)
                                    : "No expiry"}
                                </span>
                              </div>

                              {item.link ? (
                                <div className="mt-2 text-[12px] text-[#93c5fd]">
                                  Link: {item.link}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] border border-[#111827] bg-[#020617] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[18px] font-semibold text-white">
                    Live Preview
                  </h2>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${getTypePreviewColor(
                      type
                    )}`}
                  >
                    {type}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-white">
                        {title.trim() || "Notification title"}
                      </div>

                      <p className="mt-2 text-[13px] leading-6 text-[#94a3b8]">
                        {message.trim() ||
                          "Your notification preview will appear here as customers will see it."}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b]">
                        <span>Just now</span>
                        <span>•</span>
                        <span>{selectedTypeMeta?.label || "System"}</span>
                        <span>•</span>
                        <span>{selectedTypeMeta?.validity || "No expiry"}</span>
                        <span>•</span>
                        <span className="truncate">{previewLink}</span>
                        {sendEmail ? (
                          <>
                            <span>•</span>
                            <span>Email enabled</span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#111827] bg-[#020617] p-5">
                <h2 className="text-[18px] font-semibold text-white">
                  Quick Examples
                </h2>

                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={fillOfferExample}
                    className="w-full rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-left transition hover:border-[#334155]"
                  >
                    <div className="text-[14px] font-medium text-white">
                      Offer example
                    </div>
                    <div className="mt-1 text-[12px] text-[#94a3b8]">
                      Sale / coupon / free shipping announcement
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={fillProductExample}
                    className="w-full rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-left transition hover:border-[#334155]"
                  >
                    <div className="text-[14px] font-medium text-white">
                      Product example
                    </div>
                    <div className="mt-1 text-[12px] text-[#94a3b8]">
                      New arrivals / restock / trending products
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={fillSystemExample}
                    className="w-full rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 text-left transition hover:border-[#334155]"
                  >
                    <div className="text-[14px] font-medium text-white">
                      System example
                    </div>
                    <div className="mt-1 text-[12px] text-[#94a3b8]">
                      Maintenance / downtime / platform notice
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#111827] bg-[#020617] p-5">
                <h2 className="text-[18px] font-semibold text-white">
                  Validity Rules
                </h2>
                <div className="mt-4 space-y-2 text-[13px] leading-6 text-[#94a3b8]">
                  <p>Offer notifications expire after 3 days.</p>
                  <p>Product notifications expire after 5 days.</p>
                  <p>System notifications expire after 1 day.</p>
                  <p>Account notifications do not expire automatically.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}