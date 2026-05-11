"use client";

type AddressType = "Shipping" | "Billing";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export default function AddressHero({
  totalAddresses,
  shippingCount,
  billingCount,
  defaultLabel,
  onAdd,
}: {
  totalAddresses: number;
  shippingCount: number;
  billingCount: number;
  defaultLabel: string;
  onAdd: (type: AddressType) => void;
}) {
  return (
    <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
            Saved delivery addresses
          </div>

          <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
            Address Book
          </h1>

          <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
            Manage your shipping and billing addresses with accurate map pin
            selection for smoother checkout.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onAdd("Shipping")}
              className={primaryBtnClass}
            >
              Add Shipping Address
            </button>

            <button
              type="button"
              onClick={() => onAdd("Billing")}
              className={secondaryBtnClass}
            >
              Add Billing Address
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          {[
            ["Total", totalAddresses],
            ["Shipping", shippingCount],
            ["Billing", billingCount],
            ["Default", defaultLabel || "—"],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                {label}
              </div>

              <div className="mt-2 truncate text-[24px] font-semibold text-white">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}