"use client";

import * as React from "react";
import {
  addMonthsSafe,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./analyticsTypes";

type Props = {
  open: boolean;
  exporting: boolean;
  exportFrom: string;
  exportTo: string;
  exportError: string;
  defaultTo: string;
  onClose: () => void;
  onExport: () => void;
  setExportFrom: (value: string) => void;
  setExportTo: (value: string) => void;
  setExportError: (value: string) => void;
};

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}) {
  const inputId = React.useId();

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
      </label>

      <input
        id={inputId}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-[48px] w-full rounded-full border border-white/10 bg-[#0d0f17] px-4 text-[13px] text-white outline-none transition focus:border-[#d6c7ff]"
      />
    </div>
  );
}

export default function ExportAnalyticsModal({
  open,
  exporting,
  exportFrom,
  exportTo,
  exportError,
  defaultTo,
  onClose,
  onExport,
  setExportFrom,
  setExportTo,
  setExportError,
}: Props) {
  if (!open) return null;

  const maxTo =
    addMonthsSafe(exportFrom, 3) < defaultTo
      ? addMonthsSafe(exportFrom, 3)
      : defaultTo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur">
      <div className={`${panelClass} w-full max-w-md p-5`}>
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-semibold text-white">
            Export Analytics
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            aria-label="Close export modal"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-[20px] text-[#a7aec4] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
          Select a date range to export analytics data. Maximum allowed range is
          3 months.
        </p>

        <div className="mt-5 space-y-4">
          <DateField
            label="From"
            value={exportFrom}
            max={exportTo || defaultTo}
            onChange={(nextFrom) => {
              setExportError("");
              setExportFrom(nextFrom);

              if (
                exportTo &&
                nextFrom &&
                new Date(nextFrom) > new Date(exportTo)
              ) {
                setExportTo(nextFrom);
              }
            }}
          />

          <DateField
            label="To"
            value={exportTo}
            min={exportFrom}
            max={maxTo}
            onChange={(value) => {
              setExportError("");
              setExportTo(value);
            }}
          />

          {exportError ? (
            <div className="rounded-[18px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] text-red-200">
              {exportError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={exporting}
              className={secondaryBtnClass}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              className={primaryBtnClass}
            >
              {exporting ? "Exporting..." : "Download CSV"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}