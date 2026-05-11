"use client";

import * as React from "react";
import { panelClass } from "./deliveryOrderTypes";

export default function DeliverySkeleton() {
  return (
    <div className="-m-6 min-h-screen overflow-x-hidden bg-[#0a0a0f] p-4 text-[#f5f7fb] sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.08),transparent_30%)]" />

      <div className="relative max-w-full space-y-5 overflow-x-hidden">
        <SkeletonHero />

        <div className="grid min-w-0 max-w-full gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
          <div className="min-w-0 space-y-5">
            <SkeletonPanel rows={6} />
            <SkeletonPanel rows={5} />
          </div>

          <div className="min-w-0 space-y-5">
            <SkeletonPanel rows={4} />
            <SkeletonPanel rows={5} />
            <SkeletonPanel rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className={`${panelClass} p-6`}>
      <div className="h-4 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="mt-5 h-10 w-full max-w-[420px] animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-4 w-full max-w-[620px] animate-pulse rounded-full bg-white/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[110px] animate-pulse rounded-[22px] bg-white/[0.05]"
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonPanel({ rows }: { rows: number }) {
  return (
    <div className={`${panelClass} p-6`}>
      <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />

      <div className="mt-5 space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-4 w-full animate-pulse rounded-full bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}