"use client";

import * as React from "react";
import { panelClass, RangeKey, rangeTabs } from "./analyticsTypes";

type Props = {
  range: RangeKey;
  loading: boolean;
  onChange: (range: RangeKey) => void;
};

export default function RangeTabs({ range, loading, onChange }: Props) {
  return (
    <section className={`${panelClass} p-2`}>
      <div className="grid grid-cols-3 gap-2">
        {rangeTabs.map((tab) => {
          const active = range === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              disabled={loading}
              className={[
                "rounded-[18px] px-3 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] transition sm:text-[13px]",
                active
                  ? "bg-white text-[#090a12]"
                  : "text-[#cbd5e1] hover:bg-white/10",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}