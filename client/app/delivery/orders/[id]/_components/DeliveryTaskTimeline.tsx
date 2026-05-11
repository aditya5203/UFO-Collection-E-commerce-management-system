"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TimelineStep,
  panelClass,
} from "./deliveryOrderTypes";
import { Dot } from "./DeliveryOrderShared";

type Props = {
  timeline: TimelineStep[];
};

export default function DeliveryTaskTimeline({ timeline }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`${panelClass} min-w-0 max-w-full overflow-hidden p-5 sm:p-6`}
    >
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          Progress
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">
          Task Timeline
        </h2>

        <p className="mt-1 text-[13px] text-[#a7aec4]">
          Current progress of this delivery task
        </p>
      </div>

      <div className="space-y-5">
        {timeline.map((t, index) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.045,
              duration: 0.32,
              ease: "easeOut",
            }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <Dot status={t.status} />

              {index !== timeline.length - 1 ? (
                <div className="mt-2 h-10 w-px bg-[#26293a]" />
              ) : null}
            </div>

            <div className="pt-1">
              <div className="text-sm font-semibold text-white">{t.label}</div>

              <div className="mt-1 text-xs text-[#a7aec4]">{t.date}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}