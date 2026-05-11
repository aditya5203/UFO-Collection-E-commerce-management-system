"use client";

type ToastType = "success" | "error" | "info";

export default function OrderToast({
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
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
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