"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
  return d.toLocaleString(); // admin can see date/time ✅
}

export default function AdminReviewsPage() {
  const router = useRouter();

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
  const [rating, setRating] = React.useState<"" | "1" | "2" | "3" | "4" | "5">("");

  const [toast, setToast] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

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
          }
        );

        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/adminlogin");
          return;
        }

        const body = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(body?.message || "Failed to load reviews");

        setReviews(Array.isArray(body?.reviews) ? body.reviews : []);
        setPagination(
          body?.pagination && typeof body.pagination === "object"
            ? body.pagination
            : { page: 1, limit: 20, total: 0, pages: 1 }
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load reviews");
        setReviews([]);
      } finally {
        setLoading(false);
      }
    },
    [router, search, rating, pagination.limit]
  );

  React.useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  async function handleDelete(id: string) {
    const ok = confirm("Delete this review?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace("/admin/adminlogin");
        return;
      }

      const body = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(body?.message || "Failed to delete review");

      setReviews((prev) => prev.filter((r) => r.id !== id));
      setToast({ type: "success", message: "Review deleted" });
    } catch (e: any) {
      setToast({ type: "error", message: e?.message || "Delete failed" });
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold">Reviews</h1>
      </div>

      {/* Filters */}
      <div className="mb-[10px] flex flex-wrap items-center gap-[10px]">
        <div className="flex flex-1 items-center rounded-[10px] border border-[#1f2937] bg-[#020617] px-3 py-2">
          <input
            className="flex-1 border-none bg-transparent text-[13px] text-[#e5e7eb] outline-none placeholder:text-[#6b7280]"
            type="text"
            placeholder="Search title/comment/orderCode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={rating}
          onChange={(e) => setRating(e.target.value as any)}
          className="rounded-lg border border-[#1f2937] bg-[#020617] px-3 py-2 text-[13px] text-[#e5e7eb]"
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
          className="rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[14px] border border-[#111827] bg-[#020617]">
        {error && <div className="px-4 py-[10px] text-[13px] text-[#fca5a5]">{error}</div>}

        {loading ? (
          <div className="p-[18px] text-[13px] text-[#9ca3af]">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="p-[18px] text-[13px] text-[#9ca3af]">No reviews found.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Product
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Customer
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Rating
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Comment
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Order
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-left text-[12px] text-[#9ca3af]">
                  Date/Time
                </th>
                <th className="border-b border-[#111827] px-4 py-[10px] text-right text-[12px] text-[#9ca3af]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-t border-[#111827] hover:bg-[#02081b]">
                  <td className="px-4 py-[10px]">
                    <div className="flex items-center gap-[10px]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0f172a]">
                        <Image
                          src={getImageSrc(r.product?.image)}
                          alt={r.product?.name || "Product"}
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      </div>
                      <div className="text-[#e5e7eb]">
                        {r.product?.name || "-"}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-[10px] text-[#cbd5e1]">
                    <div className="font-medium">{r.customer?.name || "-"}</div>
                    <div className="text-[12px] text-[#9ca3af]">{r.customer?.email || ""}</div>
                  </td>

                  <td className="px-4 py-[10px] text-[#7dd3fc] font-semibold">
                    {Number(r.rating || 0).toFixed(1)} / 5
                  </td>

                  <td className="px-4 py-[10px] text-[#cbd5e1]">
                    <div className="font-semibold text-white">
                      {r.title?.trim() ? r.title : "Review"}
                    </div>
                    <div className="text-[12px] text-[#9ca3af] line-clamp-2">
                      {r.comment || "-"}
                    </div>
                  </td>

                  <td className="px-4 py-[10px] text-[#cbd5e1]">{r.orderCode || "-"}</td>

                  <td className="px-4 py-[10px] text-[#cbd5e1]">{fmtDate(r.createdAt)}</td>

                  <td className="px-4 py-[10px] text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] font-semibold text-red-200 hover:bg-red-500/15"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-[13px] text-[#9ca3af]">
        <div>
          Total: <span className="text-white font-semibold">{pagination.total}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => fetchReviews(pagination.page - 1)}
            className="rounded-lg border border-[#1f2937] bg-[#020617] px-3 py-2 disabled:opacity-50"
          >
            Prev
          </button>

          <div>
            Page <span className="text-white font-semibold">{pagination.page}</span> /{" "}
            <span className="text-white font-semibold">{pagination.pages}</span>
          </div>

          <button
            type="button"
            disabled={pagination.page >= pagination.pages || loading}
            onClick={() => fetchReviews(pagination.page + 1)}
            className="rounded-lg border border-[#1f2937] bg-[#020617] px-3 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={[
            "fixed bottom-5 right-5 z-[1200] rounded-xl px-[14px] py-3 text-[13px] font-semibold text-[#0f172a]",
            "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
            toast.type === "success"
              ? "border border-[#22c55e] bg-[#bbf7d0]"
              : "border border-[#f43f5e] bg-[#fecdd3]",
          ].join(" ")}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
