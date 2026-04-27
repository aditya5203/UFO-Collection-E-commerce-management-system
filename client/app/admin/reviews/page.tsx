// client/app/admin/reviews/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import AdminPageGuard from "../_components/AdminPageGuard";
import {
  AdminPermissions,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

type ReviewRow = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  orderCode: string;
  createdAt?: string;
  product: null | {
    id: string;
    name: string;
    image: string;
  };
  customer: null | {
    id: string;
    name: string;
    email: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const PLACEHOLDER = "/images/products/placeholder.png";

const getImageSrc = (image?: string) => {
  if (!image) return PLACEHOLDER;
  const src = image.trim();
  if (!src) return PLACEHOLDER;
  if (src.startsWith("/")) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return PLACEHOLDER;
};

function fmtDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<ReviewRow[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [rating, setRating] = React.useState<"" | "1" | "2" | "3" | "4" | "5">(
    ""
  );

  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [permissions, setPermissions] =
    React.useState<AdminPermissions | null>(null);

  const canDelete = hasPermission(role, permissions, "reviewDelete");

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  React.useEffect(() => {
    let mounted = true;

    const loadAdminProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const body = (await safeJson(res)) as AdminSettingsResponse;
        const nextRole = (body?.profile?.role || "admin") as
          | "admin"
          | "superadmin";
        const nextPermissions = normalizeAdminPermissions(
          nextRole,
          body?.profile?.permissions
        );

        if (!mounted) return;
        setRole(nextRole);
        setPermissions(nextPermissions);
      } catch {}
    };

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchReviews = React.useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (rating) params.set("rating", rating);
        params.set("page", String(page));
        params.set("limit", String(pagination.limit));

        const res = await fetch(
          `${API_BASE_URL}/api/admin/reviews?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const body = await safeJson(res);
        if (!res.ok) {
          throw new Error((body as any)?.message || "Failed to load reviews");
        }

        setReviews(
          Array.isArray((body as any)?.reviews) ? (body as any).reviews : []
        );
        setPagination(
          (body as any)?.pagination &&
            typeof (body as any).pagination === "object"
            ? (body as any).pagination
            : { page: 1, limit: 20, total: 0, pages: 1 }
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load reviews");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    },
    [search, rating, pagination.limit]
  );

  React.useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  async function handleDelete(id: string) {
    if (!canDelete) {
      setToast({
        type: "error",
        message: "You do not have permission to delete reviews",
      });
      return;
    }

    const ok = confirm("Delete this review?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const body = await safeJson(res);
      if (!res.ok) {
        throw new Error((body as any)?.message || "Failed to delete review");
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
      setToast({ type: "success", message: "Review deleted" });

      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Delete failed" });
    }
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
        reviews.length
      : 0;

  return (
    <AdminPageGuard permission="reviewView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Admin / Reviews
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Reviews
                </h1>

                <p className="mt-2 max-w-[680px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Monitor product reviews, ratings, customer feedback, order
                  references, and remove inappropriate reviews when required.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchReviews(1)}
                className={primaryBtnClass}
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_auto]">
              <div className="flex h-[48px] items-center rounded-full border border-white/10 bg-white/5 px-4">
                <label htmlFor="review-search" className="sr-only">
                  Search reviews
                </label>
                <input
                  id="review-search"
                  name="reviewSearch"
                  title="Search reviews"
                  aria-label="Search reviews"
                  className="w-full border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#7f879f]"
                  type="text"
                  placeholder="Search title, comment, order code"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                id="review-rating-filter"
                name="reviewRatingFilter"
                title="Review rating filter"
                aria-label="Review rating filter"
                value={rating}
                onChange={(e) => setRating(e.target.value as any)}
                className="h-[48px] rounded-full border border-white/10 bg-white/5 px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]"
              >
                <option value="">Rating: All</option>
                <option value="5">Rating: 5</option>
                <option value="4">Rating: 4</option>
                <option value="3">Rating: 3</option>
                <option value="2">Rating: 2</option>
                <option value="1">Rating: 1</option>
              </select>

              <button
                type="button"
                onClick={() => fetchReviews(1)}
                className={secondaryBtnClass}
              >
                Apply
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Reviews"
              value={String(pagination.total)}
              hint="All matching reviews"
              iconSrc="/images/admin/review.png"
            />
            <StatCard
              label="Current Page"
              value={String(reviews.length)}
              hint="Loaded reviews"
              iconSrc="/images/admin/page.png"
            />
            <StatCard
              label="Avg Rating"
              value={averageRating.toFixed(1)}
              hint="Current page average"
              iconSrc="/images/admin/rating.png"
            />
            <StatCard
              label="Pages"
              value={`${pagination.page}/${pagination.pages}`}
              hint="Pagination"
              iconSrc="/images/admin/pagination.png"
            />
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-5 py-4 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <section className={`${panelClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Customer Feedback
                </div>
                <h2 className="mt-1 text-[20px] font-semibold text-white">
                  Product Reviews
                </h2>
                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Product, customer, rating, comment, order and review date.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-[#d6c7ff]">
                {reviews.length} visible
              </div>
            </div>

            {loading ? (
              <ReviewSkeleton />
            ) : reviews.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Product</th>
                      <th className="px-5 py-4 font-medium">Customer</th>
                      <th className="px-5 py-4 font-medium">Rating</th>
                      <th className="px-5 py-4 font-medium">Comment</th>
                      <th className="px-5 py-4 font-medium">Order</th>
                      <th className="px-5 py-4 font-medium">Date/Time</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reviews.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[16px] border border-white/10 bg-[#0d0f17]">
                              <Image
                                src={getImageSrc(r.product?.image)}
                                alt={r.product?.name || "Product"}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="line-clamp-1 font-semibold text-white">
                                {r.product?.name || "-"}
                              </div>
                              <div className="mt-1 text-[12px] text-[#7f879f]">
                                Product
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {r.customer?.name || "-"}
                          </div>
                          <div className="mt-1 text-[12px] text-[#7f879f]">
                            {r.customer?.email || ""}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-300">
                            {Number(r.rating || 0).toFixed(1)} / 5
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {r.title?.trim() ? r.title : "Review"}
                          </div>
                          <div className="mt-1 line-clamp-2 max-w-[360px] text-[12px] leading-5 text-[#a7aec4]">
                            {r.comment || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
                            {r.orderCode || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-[#a7aec4]">
                          {fmtDate(r.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:-translate-y-0.5 hover:bg-red-500/15"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-[12px] text-[#7f879f]">
                              No delete access
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 rounded-[20px] border border-[#26293a] bg-[#11121a] px-5 py-4 text-[13px] text-[#a7aec4] sm:flex-row sm:items-center sm:justify-between">
            <div>
              Total:{" "}
              <span className="font-semibold text-white">
                {pagination.total}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchReviews(pagination.page - 1)}
                className={secondaryBtnClass}
              >
                Prev
              </button>

              <div>
                Page{" "}
                <span className="font-semibold text-white">
                  {pagination.page}
                </span>{" "}
                /{" "}
                <span className="font-semibold text-white">
                  {pagination.pages}
                </span>
              </div>

              <button
                type="button"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchReviews(pagination.page + 1)}
                className={secondaryBtnClass}
              >
                Next
              </button>
            </div>
          </div>

          {toast && (
            <div
              className={[
                "fixed bottom-5 right-5 z-[1200] rounded-[18px] px-5 py-4 text-[13px] font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                toast.type === "success"
                  ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
                  : "border border-red-400/20 bg-red-500/15 text-red-200",
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              {toast.message}
            </div>
          )}
        </div>
      </div>
    </AdminPageGuard>
  );
}

function StatCard({
  label,
  value,
  hint,
  iconSrc,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  iconSrc: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
            {label}
          </div>
          <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
            {value}
          </div>
          {hint ? (
            <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div>
          ) : null}
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5">
          <Image src={iconSrc} alt={label} width={22} height={22} />
        </div>
      </div>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[18px] border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/5">
        <Image
          src="/images/admin/reviews.png"
          alt="Reviews"
          width={26}
          height={26}
        />
      </div>

      <div className="mt-4 text-[18px] font-semibold text-white">
        No reviews found
      </div>

      <p className="mx-auto mt-2 max-w-[420px] text-[13px] leading-7 text-[#a7aec4]">
        Reviews will appear here when customers submit product feedback or when
        your search and rating filter match existing reviews.
      </p>
    </div>
  );
}