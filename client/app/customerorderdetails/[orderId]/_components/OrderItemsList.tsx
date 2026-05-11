"use client";

import Image from "next/image";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const FALLBACK_PRODUCT_IMAGE = "/images/product-placeholder.png";

function formatNPR(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString("en-NP")}`;
}

function getProductImage(src?: string) {
  const value = String(src || "").trim();
  return value || FALLBACK_PRODUCT_IMAGE;
}

function getColorDotClass(color?: string) {
  const c = String(color || "").trim().toLowerCase();

  const map: Record<string, string> = {
    black: "bg-black",
    "#000000": "bg-black",
    white: "bg-white",
    "#ffffff": "bg-white",
    red: "bg-red-500",
    "#ef4444": "bg-red-500",
    blue: "bg-blue-500",
    "#3b82f6": "bg-blue-500",
    green: "bg-green-500",
    "#22c55e": "bg-green-500",
    yellow: "bg-yellow-500",
    "#eab308": "bg-yellow-500",
    pink: "bg-pink-500",
    "#ec4899": "bg-pink-500",
    purple: "bg-purple-500",
    "#a855f7": "bg-purple-500",
    orange: "bg-orange-500",
    "#f97316": "bg-orange-500",
    gray: "bg-gray-500",
    grey: "bg-gray-500",
    "#808080": "bg-gray-500",
    navy: "bg-[#000080]",
    "navy blue": "bg-[#000080]",
    "#000080": "bg-[#000080]",
  };

  return map[c] || "bg-[#16191f]";
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div>
      {eyebrow ? (
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
        {title}
      </h2>
    </div>
  );
}

export default function OrderItemsList({
  order,
  raiseTicket,
  openReviewModal,
}: {
  order: any;
  raiseTicket: (item: any) => void;
  openReviewModal: (item: any) => void;
}) {
  return (
    <section className={`${panelClass} p-5 sm:p-7`}>
      <SectionTitle eyebrow="Products" title="Items Purchased" />

      <div className="mt-5 overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824]">
        <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_0.7fr] border-b border-[#26293a] px-5 py-4 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4] md:grid">
          <div>Product</div>
          <div>Size</div>
          <div>Color</div>
          <div className="text-center">Qty</div>
          <div>Total</div>
        </div>

        {order.items.map((it: any) => (
          <div
            key={`${it.id}-${it.size}-${it.color}`}
            className="border-b border-[#26293a] p-5 transition hover:bg-white/[0.02] last:border-0"
          >
            <div className="hidden grid-cols-[1.4fr_0.6fr_0.8fr_0.7fr_0.7fr] items-center gap-4 md:grid">
              <div className="flex items-center gap-4">
                <div className="relative h-[72px] w-[72px] overflow-hidden rounded-[18px] border border-[#26293a] bg-[#0d0f17]">
                  <Image
                    src={getProductImage(it.image)}
                    alt={it.name || "Product image"}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="line-clamp-1 font-semibold text-white">
                    {it.name}
                  </div>

                  <div className="mt-1 text-[12px] text-[#a7aec4]">
                    {formatNPR(it.price)} per item
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => raiseTicket(it)}
                      disabled={order.status === "Cancelled"}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Need Help?
                    </button>

                    <button
                      type="button"
                      onClick={() => openReviewModal(it)}
                      disabled={order.status !== "Delivered"}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Write Review
                    </button>
                  </div>
                </div>
              </div>

              <span className="text-[#a7aec4]">{it.size || "-"}</span>

              <div className="flex items-center gap-2 text-[#a7aec4]">
                <span
                  className={`h-4 w-4 rounded-full border border-white/30 ${getColorDotClass(
                    it.color || it.colorLabel,
                  )}`}
                />
                <span>{it.colorLabel || it.color || "-"}</span>
              </div>

              <div className="text-center text-[#a7aec4]">{it.qty}</div>

              <span className="font-semibold text-[#d6c7ff]">
                {formatNPR(it.price * it.qty)}
              </span>
            </div>

            <div className="flex gap-4 md:hidden">
              <div className="relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[18px] border border-[#26293a] bg-[#0d0f17]">
                <Image
                  src={getProductImage(it.image)}
                  alt={it.name || "Product image"}
                  fill
                  sizes="82px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 font-semibold text-white">
                  {it.name}
                </div>

                <div className="mt-2 grid gap-1 text-sm text-[#a7aec4]">
                  <div>Size: {it.size || "-"}</div>

                  <div className="flex items-center gap-2">
                    <span>Color:</span>
                    <span
                      className={`h-4 w-4 rounded-full border border-white/30 ${getColorDotClass(
                        it.color || it.colorLabel,
                      )}`}
                    />
                    <span>{it.colorLabel || it.color || "-"}</span>
                  </div>

                  <div>Qty: {it.qty}</div>
                  <div>Price: {formatNPR(it.price)}</div>
                  <div className="font-semibold text-[#d6c7ff]">
                    Total: {formatNPR(it.price * it.qty)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => raiseTicket(it)}
                    disabled={order.status === "Cancelled"}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Need Help?
                  </button>

                  <button
                    type="button"
                    onClick={() => openReviewModal(it)}
                    disabled={order.status !== "Delivered"}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}