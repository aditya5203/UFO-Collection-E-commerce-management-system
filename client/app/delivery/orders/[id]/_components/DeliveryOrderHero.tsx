"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DeliveryTaskType,
  getTaskLabel,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./deliveryOrderTypes";
import {
  StatusPill,
  SummaryCard,
  TaskPill,
} from "./DeliveryOrderShared";

type Props = {
  orderCode: string;
  orderId: string;
  taskType: DeliveryTaskType;
  currentStatus: string;
  orderLifecycleStatus: string;
  assignedAt: string;
  assignedAtFull: string;
  paymentMethod?: string;
  blockedByOrderStatus: boolean;
  blockedReason: string;
  refreshing: boolean;
  customerPhoneLink: string;
  mapsLink: string;
  customerName: string;
  customerEmail: string;
  itemsCount: number;
  onRefresh: () => void;
};

export default function DeliveryOrderHero({
  orderCode,
  orderId,
  taskType,
  currentStatus,
  orderLifecycleStatus,
  assignedAt,
  assignedAtFull,
  paymentMethod,
  blockedByOrderStatus,
  blockedReason,
  refreshing,
  customerPhoneLink,
  mapsLink,
  customerName,
  customerEmail,
  itemsCount,
  onRefresh,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`${panelClass} relative min-w-0 max-w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.12),transparent_34%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6 lg:p-7`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#8b5cf6]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="break-words text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Delivery <span className="mx-2 text-[#7f879f]">/</span> Tasks{" "}
            <span className="mx-2 text-[#7f879f]">/</span>{" "}
            {orderCode || orderId}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="break-words text-[28px] font-semibold tracking-[-0.045em] text-white sm:text-[38px]">
              {orderCode || orderId}
            </h1>

            <TaskPill taskType={taskType} />
            <StatusPill>{currentStatus}</StatusPill>

            {orderLifecycleStatus &&
            orderLifecycleStatus !== "Pending" &&
            orderLifecycleStatus !== currentStatus ? (
              <StatusPill>{orderLifecycleStatus}</StatusPill>
            ) : null}
          </div>

          <p className="mt-2 max-w-[720px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            {getTaskLabel(taskType)} assigned on {assignedAt}
            {paymentMethod ? (
              <>
                <span className="mx-2 text-[#7f879f]">•</span>
                <span>{paymentMethod}</span>
              </>
            ) : null}
          </p>

          {blockedByOrderStatus ? (
            <div className="mt-4 rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-6 text-red-200">
              <div className="font-semibold">Delivery blocked</div>
              <div className="mt-1">{blockedReason}</div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={primaryBtnClass}
          >
            {refreshing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
                Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </button>

          {customerPhoneLink ? (
            <a href={customerPhoneLink} className={secondaryBtnClass}>
              Call Customer
            </a>
          ) : null}

          {mapsLink ? (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryBtnClass}
            >
              Open Map
            </a>
          ) : null}

          <Link href="/delivery/orders" className={secondaryBtnClass}>
            Back
          </Link>
        </div>
      </div>

      <div className="relative mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          index={0}
          label="Customer"
          value={customerName || "-"}
          hint={customerEmail || "No email"}
        />

        <SummaryCard
          index={1}
          label="Task Type"
          value={getTaskLabel(taskType)}
          hint="Assigned delivery task"
        />

        <SummaryCard
          index={2}
          label="Items"
          value={String(itemsCount)}
          hint="Products / variants in this order"
        />

        <SummaryCard
          index={3}
          label="Assigned Date"
          value={assignedAt}
          hint={assignedAtFull}
        />
      </div>
    </motion.section>
  );
}