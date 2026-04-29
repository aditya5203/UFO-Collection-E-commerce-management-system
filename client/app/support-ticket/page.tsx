// client/app/support-ticket/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type TicketType =
  | "Damaged Item"
  | "Late Delivery"
  | "Wrong Item"
  | "Payment Issue"
  | "Other";

type ToastType = "success" | "error" | "info";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const inputClass =
  "h-12 w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";
const textareaClass =
  "w-full resize-none rounded-[20px] border border-[#2b3042] bg-[#0d0f17] px-5 py-4 text-[14px] leading-7 text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[10000] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />
        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[13px] font-medium text-[#d6dbeb]"
      >
        {label} {required ? <span className="text-red-300">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function SupportTicketPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";
  const productId = searchParams.get("productId") || "";
  const productName = searchParams.get("productName") || "";
  const size = searchParams.get("size") || "";
  const color = searchParams.get("color") || "";

  const [type, setType] = React.useState<TicketType | "">("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [userLoaded, setUserLoaded] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const loadMe = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          "";

        const candidates = [
          `${API}/auth/me`,
          `${API}/customers/me`,
          `${API}/users/me`,
          `${API}/profile/me`,
        ];

        let me: any = null;

        for (const url of candidates) {
          try {
            const res = await fetch(url, {
  method: "GET",
  credentials: "include",
  cache: "no-store",
  headers: {
    "Cache-Control": "no-cache",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

            if (res.ok) {
              const data = await res.json().catch(() => null);
              me = data?.data || data?.user || data?.customer || data;
              break;
            }
          } catch {}
        }

        if (!me) {
          try {
            const raw = localStorage.getItem("auth_user");
            if (raw) me = JSON.parse(raw);
          } catch {}
        }

        if (me?.name) setName(String(me.name));
        if (me?.email) setEmail(String(me.email));
        if (me?.name || me?.email) setUserLoaded(true);
      } catch {
        try {
          const raw = localStorage.getItem("auth_user");
          if (!raw) return;

          const u = JSON.parse(raw);
          if (u?.name) setName(String(u.name));
          if (u?.email) setEmail(String(u.email));
          if (u?.name || u?.email) setUserLoaded(true);
        } catch {}
      }
    };

    loadMe();
  }, []);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  React.useEffect(() => {
    if (!subject.trim() && productName && orderId) {
      setSubject(`Issue with ${productName} (${orderId})`);
    }
  }, [productName, orderId, subject]);

  React.useEffect(() => {
    if (!previewOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [previewOpen]);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onPickFile = (f?: File | null) => {
    if (!f) {
      setFile(null);
      setPreviewOpen(false);
      resetFileInput();
      return;
    }

    if (!f.type.startsWith("image/")) {
      showToast("Please upload an image file: JPG, PNG, or WEBP.", "error");
      resetFileInput();
      return;
    }

    const maxMb = 5;

    if (f.size > maxMb * 1024 * 1024) {
      showToast(`Image is too large. Max ${maxMb}MB allowed.`, "error");
      resetFileInput();
      return;
    }

    setFile(f);
    showToast("Image selected successfully.", "success");
  };

  const validate = () => {
    if (!type) return "Please select a ticket type.";
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (!subject.trim()) return "Please enter a subject.";
    if (!message.trim()) return "Please enter your message.";
    if (message.trim().length < 10) {
      return "Please explain your issue in at least 10 characters.";
    }
    return "";
  };

  const submit = async () => {
    if (submitting) return;

    const validationError = validate();

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("issueType", type);
      fd.append("type", type);
      fd.append("name", name.trim());
      fd.append("email", email.trim());
      fd.append("subject", subject.trim());
      fd.append("message", message.trim());

      if (orderId) fd.append("orderId", orderId);
      if (productId) fd.append("productId", productId);
      if (productName) fd.append("productName", productName);
      if (size) fd.append("size", size);
      if (color) fd.append("color", color);
      if (file) fd.append("image", file);

      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";

      const res = await fetch(`${API}/customer-tickets/my`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        showToast("Please login to submit a support ticket.", "info");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit ticket.");
      }

      const code =
        data?.item?.ticketCode ||
        data?.data?.ticketCode ||
        data?.ticket?.ticketCode ||
        data?.ticketCode ||
        "";

      showToast(
        code
          ? `Ticket submitted successfully: ${code}`
          : "Ticket submitted successfully.",
        "success"
      );

      setType("");
      setSubject(productName && orderId ? `Issue with ${productName} (${orderId})` : "");
      setMessage("");
      setFile(null);
      setPreviewOpen(false);
      resetFileInput();
    } catch (e: any) {
      showToast(e?.message || "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const clearForm = () => {
    setType("");
    setSubject(productName && orderId ? `Issue with ${productName} (${orderId})` : "");
    setMessage("");
    setFile(null);
    setPreviewOpen(false);
    resetFileInput();
    showToast("Form cleared.", "info");
  };

  const cleanOrderId = orderId.replaceAll("#", "");

  const orderUrl = cleanOrderId
    ? `/customerorderdetails/${encodeURIComponent(cleanOrderId)}`
    : "";

  return (
    <>
      <CartHeader backHref="/profile" />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-6 text-[13px] text-[#a7aec4]">
            <Link href="/profile" className="transition hover:text-white">
              Profile
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Support Ticket</span>
          </div>

          <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Customer Support
                </div>

                <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                  Raise Support Ticket
                </h1>

                <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
                  Report damaged items, late delivery, wrong product, payment
                  problems, or any order-related issue. Add a clear image to help
                  the admin solve it faster.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/profile/tickets")}
                    className={secondaryBtnClass}
                  >
                    My Tickets
                  </button>

                  {orderUrl ? (
                    <button
                      type="button"
                      onClick={() => router.push(orderUrl)}
                      className={primaryBtnClass}
                    >
                      View Order
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Order ID", orderId || "—"],
                  ["Product", productName || "—"],
                  ["Size", size || "—"],
                  ["Color", color || "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      {label}
                    </div>

                    <div className="mt-2 truncate text-[15px] font-semibold text-white">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className={`${panelClass} p-5 sm:p-6`}>
              <div className="mb-6">
                <div className="text-[22px] font-semibold text-white">
                  Ticket Details
                </div>
                <div className="mt-1 text-[14px] text-[#a7aec4]">
                  Fill the details below and submit your issue.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Ticket Type" required htmlFor="ticketType">
                  <select
                    id="ticketType"
                    value={type}
                    onChange={(e) => setType(e.target.value as TicketType)}
                    className={inputClass}
                    aria-label="Ticket type"
                    disabled={submitting}
                  >
                    <option value="">Choose ticket type</option>
                    <option value="Damaged Item">Damaged Item</option>
                    <option value="Late Delivery">Late Delivery</option>
                    <option value="Wrong Item">Wrong Item</option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Name" required htmlFor="name">
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={userLoaded && Boolean(name)}
                    placeholder="Enter your name"
                    className={`${inputClass} ${
                      userLoaded && name ? "opacity-80" : ""
                    }`}
                    aria-label="Name"
                    disabled={submitting}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Email" required htmlFor="email">
                    <input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={userLoaded && Boolean(email)}
                      placeholder="Enter your email"
                      type="email"
                      className={`${inputClass} ${
                        userLoaded && email ? "opacity-80" : ""
                      }`}
                      aria-label="Email"
                      disabled={submitting}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Subject" required htmlFor="subject">
                    <input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className={inputClass}
                      aria-label="Subject"
                      disabled={submitting}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Message" required htmlFor="message">
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your issue clearly..."
                      rows={7}
                      className={textareaClass}
                      aria-label="Message"
                      disabled={submitting}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={clearForm}
                  disabled={submitting}
                  className={secondaryBtnClass}
                >
                  Clear
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className={primaryBtnClass}
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </section>

            <aside className="space-y-6">
              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[20px] font-semibold text-white">
                      Attachment
                    </div>
                    <div className="mt-1 text-[13px] text-[#a7aec4]">
                      Optional image proof.
                    </div>
                  </div>

                  {file ? (
                    <button
                      type="button"
                      onClick={() => onPickFile(null)}
                      disabled={submitting}
                      className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <label className="mt-5 flex cursor-pointer items-center justify-center rounded-[22px] border border-dashed border-[#26293a] bg-[#161824] px-4 py-8 text-center transition hover:border-[#4a506b] hover:bg-white/[0.03]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    disabled={submitting}
                    onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                  />

                  <div className="text-[14px] text-[#a7aec4]">
                    <div className="font-semibold text-white">
                      Click to upload image
                    </div>
                    <div className="mt-1">JPG, PNG, WEBP • max 5MB</div>
                  </div>
                </label>

                <div className="mt-5 rounded-[22px] border border-[#26293a] bg-[#161824] p-4">
                  {previewUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="relative block aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-[#26293a]"
                    >
                      <img
                        src={previewUrl}
                        alt="Uploaded preview"
                        className="h-full w-full object-cover transition hover:scale-[1.02]"
                      />
                    </button>
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-[#26293a] bg-[#0d0f17] text-center text-[14px] text-[#a7aec4]">
                      No image uploaded.
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[13px] leading-6 text-[#a7aec4]">
                  Tip: Upload a clear photo of the product label, package, or
                  defect so support can respond faster.
                </p>
              </section>

              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="text-[20px] font-semibold text-white">
                  Need help faster?
                </div>

                <p className="mt-2 text-[14px] leading-7 text-[#a7aec4]">
                  You can also chat with support or check your previous tickets.
                </p>

                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        orderId
                          ? `/live-agent-chat?orderId=${encodeURIComponent(
                              orderId
                            )}`
                          : "/live-agent-chat"
                      )
                    }
                    className={primaryBtnClass}
                  >
                    Live Chat
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/profile/tickets")}
                    className={secondaryBtnClass}
                  >
                    My Tickets
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {previewOpen && previewUrl ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[4px]">
          <div className="relative w-full max-w-[1000px] overflow-hidden rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
            <div className="flex items-center justify-between border-b border-[#26293a] px-5 py-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Attachment Preview
                </div>
                <div className="mt-1 text-[18px] font-semibold text-white">
                  Uploaded Ticket Image
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[78vh] overflow-auto bg-[#0d0f17] p-4">
              <img
                src={previewUrl}
                alt="Fullscreen ticket attachment"
                className="mx-auto max-h-[72vh] w-auto max-w-full rounded-[18px] object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      <MainFooter />
    </>
  );
}

export default function SupportTicketPage() {
  return (
    <React.Suspense
      fallback={
        <>
          <CartHeader />
          <main className={shellClass}>
            <div className={containerClass}>
              <div className={`${panelClass} p-8 text-[#a7aec4]`}>
                Loading support ticket...
              </div>
            </div>
          </main>
          <MainFooter />
        </>
      }
    >
      <SupportTicketPageInner />
    </React.Suspense>
  );
}