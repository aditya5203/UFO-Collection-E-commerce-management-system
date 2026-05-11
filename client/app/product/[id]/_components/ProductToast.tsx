"use client";

type Toast = {
  id: number;
  type: "success" | "error";
  message: string;
};

export default function ProductToast({ toast }: { toast: Toast | null }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-24 z-[9999]">
      <div
        className={`rounded-2xl border px-5 py-3 text-sm font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur ${
          toast.type === "error"
            ? "border-red-400/30 bg-red-500/20 text-red-100"
            : "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}