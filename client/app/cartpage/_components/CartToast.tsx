"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

type Toast = {
  id: number;
  type: "success" | "error";
  message: string;
  undo?: () => void;
};

export default function CartToast({
  toast,
  onClose,
}: {
  toast: Toast | null;
  onClose: () => void;
}) {
  const { t } = useI18n();

  if (!toast) return null;

  return (
    <div className="fixed right-4 top-24 z-[9999] max-w-[calc(100vw-2rem)]">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur ${
          toast.type === "error"
            ? "border-red-400/30 bg-red-500/20 text-red-100"
            : "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
        }`}
      >
        <span>{toast.message}</span>

        {toast.undo ? (
          <button
            type="button"
            onClick={() => {
              toast.undo?.();
              onClose();
            }}
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition hover:bg-white/10"
          >
            {t("cart.undo")}
          </button>
        ) : null}
      </div>
    </div>
  );
}