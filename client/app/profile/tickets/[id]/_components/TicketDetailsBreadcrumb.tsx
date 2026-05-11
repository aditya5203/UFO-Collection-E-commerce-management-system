"use client";

export default function TicketDetailsBreadcrumb({
  goProfile,
  goTickets,
}: {
  goProfile: () => void;
  goTickets: () => void;
}) {
  return (
    <div className="mb-6 text-[13px] text-[#a7aec4]">
      <button
        type="button"
        onClick={goProfile}
        className="transition hover:text-white"
      >
        Profile
      </button>

      <span className="mx-2">/</span>

      <button
        type="button"
        onClick={goTickets}
        className="transition hover:text-white"
      >
        Support Tickets
      </button>

      <span className="mx-2">/</span>

      <span className="text-white">Ticket Details</span>
    </div>
  );
}