"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  image: string;
};

type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type Order = {
  orderId: string;
  status: OrderStatus;

  customer: {
    name: string;
    email: string;
    shippingAddress: string;
  };

  items: OrderItem[];

  payment: {
    method: string;
  };

  shipping: {
    method: string;
    estimatedDelivery: string;
  };

  summary: {
    subtotal: number;
    shipping: number;
    taxes: number;
    total: number;
  };
};

type ReviewDraft = {
  productId: string;
  productName: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    Pending: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    Confirmed: "bg-blue-500/15 text-blue-200 border-blue-500/30",
    Shipped: "bg-purple-500/15 text-purple-200 border-purple-500/30",
    Delivered: "bg-green-500/15 text-green-200 border-green-500/30",
    Cancelled: "bg-red-500/15 text-red-200 border-red-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

export default function CustomerOrderDetailsPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderIdFromUrl = params?.orderId ? String(params.orderId) : "";

  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Review modal state
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewSaving, setReviewSaving] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [reviewOk, setReviewOk] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<ReviewDraft | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!orderIdFromUrl) {
          setOrder(null);
          setError("Order ID is missing in the URL.");
          return;
        }

        const meRes = await fetch(`${API}/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (meRes.status === 401) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `${API}/orders/my/${encodeURIComponent(orderIdFromUrl)}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.message || "Failed to load order");

        if (!mounted) return;
        setOrder(data?.order || null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Something went wrong");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [orderIdFromUrl, router]);

  const trackingNumber = (order?.orderId || orderIdFromUrl).replace("#", "");

  const raiseTicket = (item: OrderItem) => {
    const params = new URLSearchParams({
      orderId: order?.orderId || orderIdFromUrl || "",
      productId: item.id,
      productName: item.name,
      size: item.size || "",
    });

    router.push(`/support-ticket?${params.toString()}`);
  };

  const openReviewModal = (item: OrderItem) => {
    setReviewError(null);
    setReviewOk(null);

    setDraft({
      productId: item.id,
      productName: item.name,
      orderId: order?.orderId || orderIdFromUrl || "",
      rating: 5,
      title: "",
      comment: "",
    });

    setReviewOpen(true);
  };

  const closeReviewModal = () => {
    setReviewOpen(false);
    setDraft(null);
    setReviewError(null);
    setReviewOk(null);
  };

  const submitReview = async () => {
    if (!draft) return;

    try {
      setReviewSaving(true);
      setReviewError(null);
      setReviewOk(null);

      const res = await fetch(`${API}/products/${draft.productId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: draft.orderId,
          rating: draft.rating,
          title: draft.title,
          comment: draft.comment,
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.message || "Failed to submit review");

      setReviewOk("Review submitted successfully!");
      setTimeout(() => {
        closeReviewModal();
      }, 900);
    } catch (e: any) {
      setReviewError(e?.message || "Failed to submit review");
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <div className="w-[26px]" />
        </div>
      </header>

      {/* PAGE */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-10">
          <h1 className="text-[36px] font-semibold">Order Details</h1>

          {loading && (
            <div className="mt-8 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
              Loading order...
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-[12px] border border-red-500/40 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && !order && (
            <div className="mt-8 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6 text-[#9aa3cc]">
              Order not found.
            </div>
          )}

          {!loading && !error && order && (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#2b2f45] bg-[#0b0f1a]/60 px-4 py-2 text-[13px] text-[#dfe3ff]">
                  Order ID:{" "}
                  <span className="text-white font-semibold">
                    {order.orderId}
                  </span>
                </span>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-6 h-px bg-[#2b2f45]" />

              {/* CUSTOMER INFO */}
              <section className="mt-10">
                <h2 className="text-[18px] font-semibold">
                  Customer Information
                </h2>

                <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-6 py-2">
                  <div className="grid grid-cols-12 gap-4 py-4 text-sm">
                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Name
                    </div>
                    <div className="col-span-12 md:col-span-9 text-white">
                      {order.customer.name}
                    </div>
                    <div className="col-span-12 h-px bg-[#2b2f45]" />

                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Email
                    </div>
                    <div className="col-span-12 md:col-span-9 text-white">
                      {order.customer.email}
                    </div>
                    <div className="col-span-12 h-px bg-[#2b2f45]" />

                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Shipping Address
                    </div>
                    <div className="col-span-12 md:col-span-9 text-white whitespace-pre-line">
                      {order.customer.shippingAddress}
                    </div>
                  </div>
                </div>
              </section>

              {/* ITEMS */}
              <section className="mt-12">
                <h2 className="text-[18px] font-semibold">Items Purchased</h2>

                <div className="mt-5 rounded-[10px] border border-[#2b2f45] bg-[#0b0f1a]/60 overflow-hidden">
                  <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.9fr_0.6fr_0.6fr] px-6 py-4 border-b border-[#2b2f45] text-[#dfe3ff]">
                    <div>Product</div>
                    <div>Size</div>
                    <div className="text-center">Quantity</div>
                    <div>Price</div>
                    <div>Total</div>
                  </div>

                  {order.items.map((it) => (
                    <div
                      key={`${it.id}-${it.size}`}
                      className="border-b border-[#1b2034] px-6 py-6 last:border-0"
                    >
                      {/* DESKTOP */}
                      <div className="hidden md:grid grid-cols-[1.2fr_0.6fr_0.9fr_0.6fr_0.6fr] items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-[46px] w-[46px] overflow-hidden rounded-full border border-[#2b2f45]">
                            <Image
                              src={it.image}
                              alt={it.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span>{it.name}</span>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => raiseTicket(it)}
                                disabled={order.status === "Cancelled"}
                                className="w-fit rounded-md border border-[#2b2f45] px-3 py-1 text-[12px] text-[#c9b9ff] hover:bg-[#1f7cff] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Need Help?
                              </button>

                              <button
                                type="button"
                                onClick={() => openReviewModal(it)}
                                disabled={order.status !== "Delivered"}
                                className="w-fit rounded-md border border-[#2b2f45] px-3 py-1 text-[12px] text-[#7dd3fc] hover:bg-[#1d9bf0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Write Review
                              </button>
                            </div>
                          </div>
                        </div>

                        <span className="text-[#9aa3cc]">
                          {it.size ? `Size: ${it.size}` : "-"}
                        </span>

                        <div className="text-center text-[#9aa3cc]">{it.qty}</div>
                        <span className="text-[#9aa3cc]">Rs. {it.price}</span>
                        <span className="text-white">Rs. {it.price * it.qty}</span>
                      </div>

                      {/* MOBILE */}
                      <div className="md:hidden flex gap-4">
                        <div className="relative h-[62px] w-[62px] overflow-hidden rounded-[12px] border border-[#2b2f45]">
                          <Image
                            src={it.image}
                            alt={it.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="font-medium">{it.name}</div>
                          <div className="mt-1 text-[#9aa3cc] text-sm">
                            Size: {it.size || "-"}
                          </div>
                          <div className="mt-1 text-[#9aa3cc] text-sm">
                            Qty: {it.qty}
                          </div>
                          <div className="mt-1 text-[#9aa3cc] text-sm">
                            Price: Rs. {it.price}
                          </div>
                          <div className="mt-1 text-white text-sm">
                            Total: Rs. {it.price * it.qty}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => raiseTicket(it)}
                              disabled={order.status === "Cancelled"}
                              className="rounded-md border border-[#2b2f45] px-3 py-1 text-[12px] text-[#c9b9ff] hover:bg-[#1f7cff] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Need Help?
                            </button>

                            <button
                              type="button"
                              onClick={() => openReviewModal(it)}
                              disabled={order.status !== "Delivered"}
                              className="rounded-md border border-[#2b2f45] px-3 py-1 text-[12px] text-[#7dd3fc] hover:bg-[#1d9bf0] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Write Review
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* PAYMENT */}
              <section className="mt-12">
                <h2 className="text-[18px] font-semibold">
                  Payment Information
                </h2>

                <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 py-2 text-sm">
                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Method
                    </div>
                    <div className="col-span-12 md:col-span-9 text-white">
                      {order.payment.method}
                    </div>
                  </div>
                </div>
              </section>

              {/* SHIPPING */}
              <section className="mt-12">
                <h2 className="text-[18px] font-semibold">
                  Shipping Information
                </h2>

                <div className="mt-5 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 px-6 py-2">
                  <div className="grid grid-cols-12 gap-4 py-4 text-sm">
                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Method
                    </div>
                    <div className="col-span-12 md:col-span-9 text-white">
                      {order.shipping.method}
                    </div>
                    <div className="col-span-12 h-px bg-[#2b2f45]" />

                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Estimated Delivery
                    </div>
                    <div className="col-span-12 md:col-span-9 text-white">
                      {order.shipping.estimatedDelivery || "—"}
                    </div>
                    <div className="col-span-12 h-px bg-[#2b2f45]" />

                    <div className="col-span-12 md:col-span-3 text-[#9aa3cc]">
                      Track Order
                    </div>
                    <div className="col-span-12 md:col-span-9">
                      <Link
                        href={`/order-tracking?tracking=${encodeURIComponent(
                          trackingNumber
                        )}`}
                        className="text-white underline underline-offset-4 hover:text-[#c9b9ff]"
                      >
                        Click here to track
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* SUMMARY */}
              <section className="mt-12 max-w-[460px] ml-auto">
                <h2 className="text-[22px] font-semibold">Summary</h2>

                <div className="mt-6 rounded-[12px] border border-[#2b2f45] bg-[#0b0f1a]/60 p-6">
                  <div className="space-y-4 text-[#9aa3cc]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-white">Rs. {order.summary.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="text-white">Rs. {order.summary.shipping}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span className="text-white">Rs. {order.summary.taxes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="text-white font-semibold">
                        Rs. {order.summary.total}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-16 text-center text-[#8b90ad] text-sm">
                © 2025 UFO Collection — All Rights Reserved
              </div>
            </>
          )}
        </div>
      </main>

      {/* REVIEW MODAL */}
      {reviewOpen && draft ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review modal"
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={closeReviewModal}
            className="absolute inset-0 bg-black/70"
            aria-label="Close modal backdrop"
            title="Close"
          />

          {/* Modal box */}
          <div className="relative w-full max-w-[560px] rounded-[16px] border border-[#2b2f45] bg-[#0b0f1a] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[18px] font-semibold text-white">
                  Write a Review
                </div>
                <div className="mt-1 text-sm text-[#9aa3cc]">
                  Product:{" "}
                  <span className="text-white font-medium">
                    {draft.productName}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#9aa3cc]">
                  Order: {draft.orderId}
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                className="rounded-lg border border-[#2b2f45] px-3 py-2 text-xs text-[#dfe3ff] hover:bg-white hover:text-[#050611]"
                aria-label="Close modal"
                title="Close"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Rating */}
              <div>
                <div className="text-[13px] uppercase tracking-[0.12em] text-[#cbd5f5]">
                  Rating
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDraft({ ...draft, rating: n })}
                      className={`h-10 w-10 rounded-xl border text-sm font-semibold ${
                        draft.rating >= n
                          ? "border-[#1d9bf0] bg-[#1d9bf0] text-white"
                          : "border-[#2b2f45] bg-transparent text-[#9aa3cc]"
                      }`}
                      aria-label={`Set rating ${n}`}
                      title={`Set rating ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="text-[13px] uppercase tracking-[0.12em] text-[#cbd5f5]">
                  Title
                </div>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Short title (optional)"
                  className="mt-2 w-full rounded-xl border border-[#2b2f45] bg-[#070a12] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] outline-none focus:border-[#1d9bf0]"
                />
              </div>

              {/* Comment */}
              <div>
                <div className="text-[13px] uppercase tracking-[0.12em] text-[#cbd5f5]">
                  Comment
                </div>
                <textarea
                  value={draft.comment}
                  onChange={(e) =>
                    setDraft({ ...draft, comment: e.target.value })
                  }
                  placeholder="Write your experience..."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl border border-[#2b2f45] bg-[#070a12] px-4 py-3 text-sm text-white placeholder:text-[#6b7280] outline-none focus:border-[#1d9bf0]"
                />
              </div>

              {reviewError ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {reviewError}
                </div>
              ) : null}

              {reviewOk ? (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  {reviewOk}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-xl border border-[#2b2f45] px-5 py-3 text-sm text-[#dfe3ff] hover:bg-white hover:text-[#050611]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSaving}
                  className="rounded-xl bg-[#1d9bf0] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1580c5] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {reviewSaving ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
