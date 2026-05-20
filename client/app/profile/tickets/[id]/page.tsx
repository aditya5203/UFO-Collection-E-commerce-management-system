"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";
import TicketToast from "../_components/TicketToast";
import AttachmentPreviewModal from "../_components/AttachmentPreviewModal";
import { type TicketStatus } from "../_components/TicketStatusBadge";
import TicketDetailsBreadcrumb from "./_components/TicketDetailsBreadcrumb";
import TicketDetailsHero from "./_components/TicketDetailsHero";
import TicketSummaryCard from "./_components/TicketSummaryCard";
import TicketMessageCard from "./_components/TicketMessageCard";
import TicketConversation from "./_components/TicketConversation";

type ToastType = "success" | "error" | "info";

type TicketDetail = {
  id: string;
  ticketCode: string;
  status: TicketStatus;
  submittedAt: string;
  issueType: string;
  subject: string;
  message: string;
  imageUrl?: string | null;
  orderId?: string | null;
  size?: string | null;
  color?: string | null;
  product: { id?: string | null; name: string };
  replies: Array<{
    id: string;
    sender: "customer" | "admin";
    text: string;
    createdAt: string;
  }>;
};

type TicketSocketPayload = {
  ticketId?: string;
  ticketCode?: string;
  status?: TicketStatus;
  message?: string;
  reply?: {
    id?: string;
    sender?: "customer" | "admin";
    text?: string;
    createdAt?: string;
  };
};

const API_BASE =
  API_BASE_URL;
const API = `${API_BASE}/api`;
const SOCKET_BASE =
  API_BASE_URL;

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

function getOrderUrl(orderId?: string | null) {
  const clean = String(orderId || "").trim().replace("#", "");
  if (!clean) return "";
  return `/customerorderdetails/${encodeURIComponent(clean)}`;
}

export default function MyTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [reply, setReply] = React.useState("");
  const [attachmentPreview, setAttachmentPreview] = React.useState<string | null>(
    null
  );

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const socketRef = React.useRef<Socket | null>(null);

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
    if (!attachmentPreview) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAttachmentPreview(null);
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [attachmentPreview]);

  const load = React.useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`${API}/tickets/my/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(data?.message || "Failed to load ticket");
      }

      const item = data?.item || null;

      setTicket(
        item
          ? {
              ...item,
              product: item.product || {
                id: item.productId || null,
                name: item.productName || "-",
              },
              replies: Array.isArray(item.replies) ? item.replies : [],
            }
          : null
      );
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!id) return;

    const socket = io(SOCKET_BASE, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      load();
    });

    socket.on("ticket:updated", (payload: TicketSocketPayload) => {
      const payloadId = String(payload?.ticketId || "");
      const status = payload?.status;

      if (payloadId !== id || !status) return;

      setTicket((prev) => (prev ? { ...prev, status } : prev));
      showToast(payload?.message || "Ticket status updated.", "info");
      load();
    });

    socket.on("ticket:reply:new", (payload: TicketSocketPayload) => {
      const payloadId = String(payload?.ticketId || "");
      const incoming = payload?.reply;

      if (payloadId !== id || !incoming?.text) return;

      setTicket((prev) => {
        if (!prev) return prev;

        const replyId = String(incoming.id || "");
        const exists =
          replyId && prev.replies.some((r) => String(r.id) === replyId);

        if (exists) {
          return payload.status ? { ...prev, status: payload.status } : prev;
        }

        return {
          ...prev,
          status: payload.status || prev.status,
          replies: [
            ...prev.replies,
            {
              id: replyId || `socket-${Date.now()}`,
              sender: incoming.sender || "admin",
              text: incoming.text || "",
              createdAt: incoming.createdAt || new Date().toISOString(),
            },
          ],
        };
      });

      if (incoming.sender === "admin") {
        showToast("Admin replied to your ticket.", "info");
      }

      load();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [SOCKET_BASE, id, load, showToast]);

  const sendReply = async () => {
    const text = reply.trim();

    if (!text) {
      showToast("Please write a message first.", "error");
      return;
    }

    if (!id) {
      showToast("Ticket ID not found.", "error");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      const res = await fetch(`${API}/tickets/my/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        throw new Error(data?.message || "Failed to send reply");
      }

      setReply("");
      showToast("Reply sent successfully.", "success");
      await load();
    } catch (e: any) {
      const msg = e?.message || "Failed to send reply";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const copyTicketId = async () => {
    const clean = String(ticket?.ticketCode || "").trim();

    if (!clean) {
      showToast("Ticket ID not found.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(clean);
      showToast("Ticket ID copied.", "success");
    } catch {
      showToast("Unable to copy ticket ID.", "error");
    }
  };

  const orderUrl = getOrderUrl(ticket?.orderId);

  return (
    <>
      <CartHeader />

      <TicketToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <TicketDetailsBreadcrumb
            goProfile={() => router.push("/profile")}
            goTickets={() => router.push("/profile/tickets")}
          />

          {err ? (
            <div className="mb-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {err}
            </div>
          ) : null}

          <TicketDetailsHero
            loading={loading}
            onBack={() => router.push("/profile/tickets")}
            onRefresh={load}
          />

          {loading || !ticket ? (
            <section className={`${panelClass} mt-8 p-6`}>
              <div className="rounded-[22px] border border-[#26293a] bg-[#161824] p-6 text-[#a7aec4]">
                Loading ticket...
              </div>
            </section>
          ) : (
            <>
              <TicketSummaryCard
                ticket={ticket}
                orderUrl={orderUrl}
                copyTicketId={copyTicketId}
                goToOrder={() => router.push(orderUrl)}
              />

              <div className="mt-8 grid gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
                <div className="space-y-8">
                  <TicketMessageCard
                    ticket={ticket}
                    setAttachmentPreview={setAttachmentPreview}
                  />
                </div>

                <TicketConversation
                  ticket={ticket}
                  reply={reply}
                  setReply={setReply}
                  saving={saving}
                  sendReply={sendReply}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <AttachmentPreviewModal
        attachmentPreview={attachmentPreview}
        onClose={() => setAttachmentPreview(null)}
      />

      <MainFooter />
    </>
  );
}