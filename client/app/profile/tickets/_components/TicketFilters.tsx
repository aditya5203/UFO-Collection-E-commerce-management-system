"use client";

type StatusFilter = "All" | "Open" | "In Progress" | "Resolved" | "Closed";
type SortValue = "newest" | "oldest";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const inputClass =
  "h-12 w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

export default function TicketFilters({
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  sortValue,
  setSortValue,
  filteredCount,
  totalCount,
  clearFilters,
}: {
  q: string;
  setQ: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  sortValue: SortValue;
  setSortValue: (value: SortValue) => void;
  filteredCount: number;
  totalCount: number;
  clearFilters: () => void;
}) {
  return (
    <section className={`${panelClass} mt-8 p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.02em] text-white">
            Filter Tickets
          </div>

          <div className="mt-1 text-[13px] text-[#a7aec4]">
            Search auto-updates while typing. You can also filter by status and
            sort by submitted date.
          </div>
        </div>

        <button type="button" onClick={clearFilters} className={secondaryBtnClass}>
          Clear Filters
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_190px]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ticket ID, subject, product..."
          className={inputClass}
          aria-label="Search tickets"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className={inputClass}
          aria-label="Filter tickets by status"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value as SortValue)}
          className={inputClass}
          aria-label="Sort tickets by date"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-[13px] text-[#a7aec4] sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing <span className="font-semibold text-white">{filteredCount}</span>{" "}
          of <span className="font-semibold text-white">{totalCount}</span>{" "}
          tickets.
        </div>

        {q.trim() ? (
          <div className="text-[#d6c7ff]">
            Searching for:{" "}
            <span className="font-semibold text-white">{q.trim()}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}