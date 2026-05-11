"use client";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const inputClass =
  "h-12 w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

export default function AddressSearch({
  search,
  setSearch,
  onClear,
}: {
  search: string;
  setSearch: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <section className={`${panelClass} mt-8 p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.02em] text-white">
            Search Addresses
          </div>

          <div className="mt-1 text-[13px] text-[#a7aec4]">
            Search by name, phone, email, city, district, or label.
          </div>
        </div>

        {search.trim() ? (
          <button type="button" onClick={onClear} className={secondaryBtnClass}>
            Clear Search
          </button>
        ) : null}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search saved addresses..."
        className={`${inputClass} mt-5`}
        aria-label="Search saved addresses"
      />
    </section>
  );
}