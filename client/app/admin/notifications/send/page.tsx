// client/app/admin/notifications/send/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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

type AlertState = {
  type: "success" | "error" | "info";
  message: string;
};

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const CLEAN_API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const API_BASE = CLEAN_API_BASE.endsWith("/api")
  ? CLEAN_API_BASE
  : `${CLEAN_API_BASE}/api`;

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const TYPE_OPTIONS: Array<{
  value: NotificationType;
  label: string;
  hint: string;
  validity: string;
  autoLink: string;
  iconSrc: string;
}> = [
  {
    value: "offer",
    label: "Offer",
    hint: "Discounts, coupons, free shipping, sale campaigns",
    validity: "Auto-expires in 3 days",
    autoLink: "/homepage",
    iconSrc: "/images/admin/offer.png",
  },
  {
    value: "product",
    label: "Product",
    hint: "New arrivals, restocks, limited stock alerts",
    validity: "Auto-expires in 5 days",
    autoLink: "/collection",
    iconSrc: "/images/admin/product.png",
  },
  {
    value: "account",
    label: "Account",
    hint: "Profile/account related updates for customers",
    validity: "No auto-expiry",
    autoLink: "/profile",
    iconSrc: "/images/admin/customer.png",
  },
  {
    value: "system",
    label: "System",
    hint: "Maintenance, downtime, general announcements",
    validity: "Auto-expires in 1 day",
    autoLink: "/homepage",
    iconSrc: "/images/admin/setting.png",
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

function normalizeNotificationType(value?: string): NotificationType {
  if (value === "product") return "product";
  if (value === "account") return "account";
  if (value === "system") return "system";
  return "offer";
}

function normalizeHistoryItem(row: any, index: number): BroadcastHistoryItem {
  return {
    broadcastId: String(
      row?.broadcastId || row?.id || row?._id || `broadcast-${index}`
    ),
    title: String(row?.title || "Notification"),
    message: String(row?.message || row?.body || ""),
    type: normalizeNotificationType(row?.type),
    link: row?.link ? String(row.link) : "",
    createdAt: row?.createdAt ? String(row.createdAt) : "",
    expiresAt: row?.expiresAt ? String(row.expiresAt) : null,
    sentCount: Number(row?.sentCount ?? row?.count ?? 0),
    isExpired: Boolean(row?.isExpired),
  };
}

function isSafeNotificationLink(value: string) {
  const v = value.trim();

  if (!v) return true;
  if (v.startsWith("/") && !v.startsWith("//")) return true;

  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getTypeTone(type: NotificationType) {
  switch (type) {
    case "offer":
      return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
    case "product":
      return "border-sky-400/20 bg-sky-500/15 text-sky-300";
    case "account":
      return "border-violet-400/20 bg-violet-500/15 text-violet-300";
    case "system":
    default:
      return "border-slate-400/20 bg-white/5 text-slate-300";
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
  const s = Math.max(0, Math.floor(diff / 1000));

  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function getTypeIconSrc(type: NotificationType) {
  return (
    TYPE_OPTIONS.find((item) => item.value === type)?.iconSrc ||
    "/images/admin/system.png"
  );
}

export default function AdminSendNotificationsPage() {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<NotificationType>("offer");
  const [link, setLink] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  const [alert, setAlert] = React.useState<AlertState | null>(null);

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

  function showAlert(nextAlert: AlertState) {
    setAlert(nextAlert);
  }

  const fetchHistory = React.useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const res = await fetch(
        `${API_BASE}/notifications/admin/broadcast-history?limit=12`,
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
        setHistoryError(
          "You do not have permission to view notification history."
        );
        return;
      }

      const json = await safeJson<ApiResponse<BroadcastHistoryItem[]>>(res);

      if (!res.ok) {
        setHistory([]);
        setHistoryError(json?.message || "Failed to load send history.");
        return;
      }

      const rawList = Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.data)
        ? json.data
        : [];

      const nextHistory = rawList
        .map(normalizeHistoryItem)
        .filter((item: BroadcastHistoryItem) => Boolean(item.broadcastId));

      setHistory(nextHistory);
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
    setAlert(null);
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
    setAlert(null);
  }, []);

  const fillProductExample = React.useCallback(() => {
    setType("product");
    setTitle("New arrivals added in Men’s Collection");
    setMessage(
      "Fresh new styles are now live in the Men’s Collection. Explore the latest arrivals today."
    );
    setLink("");
    setAlert(null);
  }, []);

  const fillSystemExample = React.useCallback(() => {
    setType("system");
    setTitle("System maintenance tonight at 11 PM");
    setMessage(
      "The website may be temporarily unavailable during scheduled maintenance tonight from 11 PM."
    );
    setLink("");
    setAlert(null);
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const cleanTitle = title.trim();
      const cleanMessage = message.trim();
      const cleanLink = link.trim();

      setAlert(null);
      setSentCount(null);
      setEmailSentCount(null);
      setEmailFailedCount(null);

      if (!cleanTitle) {
        showAlert({ type: "error", message: "Title is required." });
        return;
      }

      if (cleanTitle.length < 3) {
        showAlert({
          type: "error",
          message: "Title must be at least 3 characters.",
        });
        return;
      }

      if (!cleanMessage) {
        showAlert({ type: "error", message: "Message is required." });
        return;
      }

      if (cleanMessage.length < 5) {
        showAlert({
          type: "error",
          message: "Message must be at least 5 characters.",
        });
        return;
      }

      if (!isSafeNotificationLink(cleanLink)) {
        showAlert({
          type: "error",
          message:
            "Link must be a safe internal path like /collection or a valid http/https URL.",
        });
        return;
      }

      try {
        setSubmitting(true);

        const res = await fetch(`${API_BASE}/notifications/admin/broadcast`, {
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
        });

        if (res.status === 401) {
          window.location.href = "/admin/adminlogin";
          return;
        }

        const json = await safeJson<ApiResponse<any[]>>(res);

        if (res.status === 403) {
          showAlert({
            type: "error",
            message:
              json?.message ||
              "You do not have permission to send notifications. Ask Superadmin to enable Notification Send permission.",
          });
          return;
        }

        if (!res.ok || !json?.success) {
          showAlert({
            type: "error",
            message: json?.message || "Failed to send notification.",
          });
          return;
        }

        const count =
          typeof json?.count === "number"
            ? json.count
            : Array.isArray(json?.data)
            ? json.data.length
            : null;

        const emailSent =
          typeof json?.emailSent === "number" ? json.emailSent : null;

        const emailFailed =
          typeof json?.emailFailed === "number" ? json.emailFailed : null;

        setSentCount(count);
        setEmailSentCount(emailSent);
        setEmailFailedCount(emailFailed);

        showAlert({
          type: "success",
          message: "Notification sent successfully.",
        });

        setTitle("");
        setMessage("");
        setLink("");
        setType("offer");
        setSendEmail(false);

        fetchHistory();
      } catch (err: any) {
        showAlert({
          type: "error",
          message: err?.message || "Failed to send notification.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [title, message, type, link, sendEmail, fetchHistory]
  );

  return (
    <AdminPageGuard permission="notificationSend">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Notifications / Broadcast
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Send Notifications
                </h1>

                <p className="mt-2 max-w-[820px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Broadcast offer, product, account, or system notifications to
                  all customer users. Expiry is automatic by type, and the same
                  message can also be sent by email.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/admin/notifications" className={secondaryBtnClass}>
                  Admin Inbox
                </Link>

                <Link href="/admin/dashboard" className={secondaryBtnClass}>
                  Dashboard
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="History"
              value={String(history.length)}
              iconSrc="/images/admin/history.png"
            />

            <StatCard
              label="Last Sent"
              value={
                history?.[0]?.createdAt
                  ? timeAgo(history[0].createdAt) || "—"
                  : "—"
              }
              iconSrc="/images/admin/send.png"
            />

            <StatCard
              label="Email Mode"
              value={sendEmail ? "On" : "Off"}
              iconSrc="/images/admin/email.png"
            />

            <StatCard
              label="Preview Link"
              value={previewLink}
              iconSrc="/images/admin/link.png"
              small
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="mb-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Compose Broadcast
                  </div>

                  <h2 className="mt-1 text-[20px] font-semibold text-white">
                    Notification Details
                  </h2>

                  <p className="mt-1 text-[13px] text-[#a7aec4]">
                    Select the broadcast type, write the customer message, and
                    choose whether email should also be sent.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                      Notification Type
                    </label>

                    <div className="grid gap-3 md:grid-cols-2">
                      {TYPE_OPTIONS.map((option) => {
                        const active = option.value === type;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setType(option.value);
                              setAlert(null);
                            }}
                            className={[
                              "rounded-[20px] border p-4 text-left transition duration-300 hover:-translate-y-0.5",
                              active
                                ? "border-[#d6c7ff]/50 bg-[#d6c7ff]/10 shadow-[0_18px_50px_rgba(139,92,246,0.16)]"
                                : "border-white/10 bg-white/[0.03] hover:border-[#4a506b]",
                            ].join(" ")}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5">
                                  <Image
                                    src={option.iconSrc}
                                    alt={option.label}
                                    width={22}
                                    height={22}
                                    className="h-[22px] w-[22px] object-contain"
                                  />
                                </div>

                                <div>
                                  <div className="text-[14px] font-semibold text-white">
                                    {option.label}
                                  </div>

                                  <div className="mt-1 text-[11px] text-[#7f879f]">
                                    {option.validity}
                                  </div>
                                </div>
                              </div>

                              {active ? (
                                <span className="rounded-full border border-[#d6c7ff]/30 bg-[#d6c7ff]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff]">
                                  Selected
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-3 text-[12px] leading-6 text-[#a7aec4]">
                              {option.hint}
                            </p>

                            <p className="mt-2 text-[11px] text-[#93c5fd]">
                              Auto link: {option.autoLink}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Field label="Title">
                    <input
                      id="notification-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Flat 20% off on all jackets"
                      maxLength={120}
                      className={inputClassName()}
                    />

                    <div className="mt-2 text-right text-[11px] text-[#7f879f]">
                      {title.length}/120
                    </div>
                  </Field>

                  <Field label="Message">
                    <textarea
                      id="notification-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write a clear message that customers will understand immediately."
                      rows={6}
                      maxLength={500}
                      className="w-full resize-none rounded-[20px] border border-white/10 bg-[#0d0f17] px-4 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                    />

                    <div className="mt-2 text-right text-[11px] text-[#7f879f]">
                      {message.length}/500
                    </div>
                  </Field>

                  <Field label="Link (optional)">
                    <input
                      id="notification-link"
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder={`Leave empty for auto link (${
                        selectedTypeMeta?.autoLink || "/homepage"
                      })`}
                      className={inputClassName()}
                    />

                    <p className="mt-2 text-[12px] text-[#7f879f]">
                      Leave empty to auto-generate by type. Current fallback:{" "}
                      <code className="text-[#d6c7ff]">
                        {selectedTypeMeta?.autoLink || "/homepage"}
                      </code>
                    </p>
                  </Field>

                  <label className="flex cursor-pointer items-start gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#4a506b]">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="mt-1 h-4 w-4"
                    />

                    <div>
                      <div className="text-[14px] font-semibold text-white">
                        Send email also
                      </div>

                      <div className="mt-1 text-[12px] leading-6 text-[#a7aec4]">
                        Customers will receive the same message by email with
                        the same destination link.
                      </div>
                    </div>
                  </label>

                  {alert ? (
                    <AlertBox
                      type={alert.type}
                      message={alert.message}
                      onClose={() => setAlert(null)}
                    />
                  ) : null}

                  {alert?.type === "success" ? (
                    <SendResult
                      sentCount={sentCount}
                      emailSentCount={emailSentCount}
                      emailFailedCount={emailFailedCount}
                      sendEmail={sendEmail}
                    />
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={primaryBtnClass}
                    >
                      {submitting ? "Sending..." : "Send Notification"}
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className={secondaryBtnClass}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </section>

              <section className={`${panelClass} overflow-hidden`}>
                <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Send History
                    </div>

                    <h2 className="mt-1 text-[20px] font-semibold text-white">
                      Recently Sent Notifications
                    </h2>

                    <p className="mt-1 text-[13px] text-[#a7aec4]">
                      Latest broadcast campaigns sent to customer users.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchHistory}
                    disabled={historyLoading}
                    className={secondaryBtnClass}
                  >
                    {historyLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  {historyLoading ? (
                    <HistorySkeleton />
                  ) : historyError ? (
                    <AlertBox
                      type="error"
                      message={historyError}
                      onClose={() => setHistoryError(null)}
                    />
                  ) : history.length === 0 ? (
                    <EmptyHistory />
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.broadcastId}
                          className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#4a506b]"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <Image
                                    src={getTypeIconSrc(item.type)}
                                    alt={item.type}
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px] shrink-0 object-contain"
                                  />

                                  <div className="truncate text-[14px] font-semibold text-white">
                                    {item.title || "Notification"}
                                  </div>
                                </div>

                                <span
                                  className={[
                                    "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                    getTypeTone(item.type),
                                  ].join(" ")}
                                >
                                  {item.type}
                                </span>

                                {item.isExpired ? (
                                  <span className="rounded-full border border-red-400/20 bg-red-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300">
                                    expired
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                                    active
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                                {item.message || ""}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#7f879f]">
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
                                <div className="mt-2 break-all text-[12px] text-[#93c5fd]">
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
              </section>
            </div>

            <aside className="space-y-6">
              <section className={`${panelClass} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Live Preview
                    </div>

                    <h2 className="mt-1 text-[20px] font-semibold text-white">
                      Customer Notification
                    </h2>
                  </div>

                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                      getTypeTone(type),
                    ].join(" ")}
                  >
                    {type}
                  </span>
                </div>

                <div className="mt-5 rounded-[20px] border border-white/10 bg-[#0d0f17] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
                        <Image
                          src={selectedTypeMeta?.iconSrc || getTypeIconSrc(type)}
                          alt={selectedTypeMeta?.label || type}
                          width={22}
                          height={22}
                          className="h-[22px] w-[22px] object-contain"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-white">
                          {title.trim() || "Notification title"}
                        </div>

                        <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                          {message.trim() ||
                            "Your notification preview will appear here as customers will see it."}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#7f879f]">
                          <span>Just now</span>
                          <span>•</span>
                          <span>{selectedTypeMeta?.label || "System"}</span>
                          <span>•</span>
                          <span>
                            {selectedTypeMeta?.validity || "No expiry"}
                          </span>
                          <span>•</span>
                          <span className="truncate text-[#93c5fd]">
                            {previewLink}
                          </span>
                          {sendEmail ? (
                            <>
                              <span>•</span>
                              <span>Email enabled</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                  </div>
                </div>
              </section>

              <section className={`${panelClass} p-5`}>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Templates
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Quick Examples
                </h2>

                <div className="mt-4 space-y-3">
                  <ExampleButton
                    title="Offer example"
                    text="Sale / coupon / free shipping announcement"
                    onClick={fillOfferExample}
                    iconSrc="/images/admin/offer.png"
                  />

                  <ExampleButton
                    title="Product example"
                    text="New arrivals / restock / trending products"
                    onClick={fillProductExample}
                    iconSrc="/images/admin/product.png"
                  />

                  <ExampleButton
                    title="System example"
                    text="Maintenance / downtime / platform notice"
                    onClick={fillSystemExample}
                    iconSrc="/images/admin/setting.png"
                  />
                </div>
              </section>

              <section className={`${panelClass} p-5`}>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Rules
                </div>

                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Validity Rules
                </h2>

                <div className="mt-4 space-y-3">
                  {TYPE_OPTIONS.map((item) => (
                    <div
                      key={item.value}
                      className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-semibold text-white">
                          <Image
                            src={item.iconSrc}
                            alt={item.label}
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] object-contain"
                          />
                          {item.label}
                        </div>

                        <span
                          className={[
                            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            getTypeTone(item.value),
                          ].join(" ")}
                        >
                          {item.value}
                        </span>
                      </div>

                      <p className="mt-2 text-[12px] leading-6 text-[#a7aec4]">
                        {item.validity}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}

function SendResult({
  sentCount,
  emailSentCount,
  emailFailedCount,
  sendEmail,
}: {
  sentCount: number | null;
  emailSentCount: number | null;
  emailFailedCount: number | null;
  sendEmail: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <ResultChip
        label="Notifications"
        value={typeof sentCount === "number" ? sentCount : "—"}
      />

      <ResultChip
        label="Emails Sent"
        value={
          sendEmail
            ? typeof emailSentCount === "number"
              ? emailSentCount
              : 0
            : "Off"
        }
      />

      <ResultChip
        label="Emails Failed"
        value={
          sendEmail
            ? typeof emailFailedCount === "number"
              ? emailFailedCount
              : 0
            : "Off"
        }
      />
    </div>
  );
}

function ResultChip({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-2 text-[18px] font-semibold text-white">{value}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  iconSrc,
  small,
}: {
  label: string;
  value: React.ReactNode;
  iconSrc: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>

          <div
            className={[
              "mt-3 font-semibold tracking-[-0.03em] text-white",
              small ? "truncate text-[16px]" : "text-[26px]",
            ].join(" ")}
          >
            {value}
          </div>
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10">
          <Image
            src={iconSrc}
            alt={label}
            width={22}
            height={22}
            className="h-[22px] w-[22px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
        {label}
      </label>

      {children}
    </div>
  );
}

function inputClassName() {
  return "h-[48px] w-full rounded-full border border-white/10 bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]";
}

function AlertBox({
  type,
  message,
  onClose,
}: {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
}) {
  const tone =
    type === "success"
      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
      : type === "error"
      ? "border-red-400/20 bg-red-500/15 text-red-200"
      : "border-blue-400/20 bg-blue-500/15 text-blue-200";

  return (
    <div
      className={[
        "flex items-start justify-between gap-3 rounded-[20px] border px-4 py-3 text-[13px] leading-6",
        tone,
      ].join(" ")}
    >
      <p>{message}</p>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-bold text-white"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

function ExampleButton({
  title,
  text,
  onClick,
  iconSrc,
}: {
  title: string;
  text: string;
  onClick: () => void;
  iconSrc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#4a506b]"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image
            src={iconSrc}
            alt={title}
            width={22}
            height={22}
            className="h-[22px] w-[22px] object-contain"
          />
        </div>

        <div>
          <div className="text-[14px] font-semibold text-white">{title}</div>

          <div className="mt-1 text-[12px] leading-6 text-[#a7aec4]">
            {text}
          </div>
        </div>
      </div>
    </button>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[96px] animate-pulse rounded-[20px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/empty.png"
          alt="Empty history"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No sent notifications yet
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Your broadcast notifications will appear here after you send them to
        customers.
      </p>
    </div>
  );
}