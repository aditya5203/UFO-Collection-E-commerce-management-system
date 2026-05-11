"use client";

import * as React from "react";
import { ToastState } from "./orderTypes";

export default function OrdersToast({
  toast,
}: {
  toast: Exclude<ToastState, null>;
}) {
  return (
    <div
      className={[
        "fixed bottom-5 right-5 z-[1200] max-w-[360px] rounded-[18px] border px-5 py-4 text-[13px] font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        toast.type === "success"
          ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
          : toast.type === "error"
            ? "border-red-400/20 bg-red-500/15 text-red-200"
            : "border-[#8b5cf6]/30 bg-[#8b5cf6]/15 text-[#e9ddff]",
      ].join(" ")}
    >
      {toast.message}
    </div>
  );
}