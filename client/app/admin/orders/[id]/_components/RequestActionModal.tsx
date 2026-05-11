"use client";

import * as React from "react";
import {
  AdminOrderDetail,
  AfterSalesAction,
  RiderRow,
  dangerBtnClass,
  formatNPR,
  inputClass,
  panelClass,
  primaryBtnClass,
  secondaryBtnClass,
  safeStr,
} from "./orderDetailsTypes";

type Props = {
  activeRequestAction: AfterSalesAction | null;
  actionTitle: string;
  order: AdminOrderDetail;
  totalPaisa: number;
  riderRequired: boolean;
  riders: RiderRow[];
  ridersLoading: boolean;
  selectedRiderId: string;
  setSelectedRiderId: (value: string) => void;
  transactionRef: string;
  setTransactionRef: (value: string) => void;
  adminNote: string;
  setAdminNote: (value: string) => void;
  requestActionLoading: boolean;
  closeRequestActionModal: () => void;
  submitRequestAction: () => void;
};

export default function RequestActionModal({
  activeRequestAction,
  actionTitle,
  order,
  totalPaisa,
  riderRequired,
  riders,
  ridersLoading,
  selectedRiderId,
  setSelectedRiderId,
  transactionRef,
  setTransactionRef,
  adminNote,
  setAdminNote,
  requestActionLoading,
  closeRequestActionModal,
  submitRequestAction,
}: Props) {
  if (!activeRequestAction) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <button
        type="button"
        onClick={closeRequestActionModal}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close modal"
      />

      <div
        className={`${panelClass} relative max-h-[90vh] w-full max-w-[580px] overflow-y-auto p-6`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d96b3]">
          Confirm Action
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-white">{actionTitle}</h2>

        <div className="mt-4 rounded-[18px] border border-[#26293a] bg-[#161824] p-4 text-sm text-[#a7aec4]">
          <p>
            Order:{" "}
            <span className="font-semibold text-white">
              {order.orderCode || order.id}
            </span>
          </p>

          <p className="mt-1">
            Customer:{" "}
            <span className="font-semibold text-white">
              {order.customer?.name || "-"}
            </span>
          </p>

          {activeRequestAction === "markRefunded" ? (
            <p className="mt-1">
              Refund Amount:{" "}
              <span className="font-semibold text-white">
                {formatNPR(Number(order.refund?.amountPaisa || totalPaisa))}
              </span>
            </p>
          ) : null}
        </div>

        {riderRequired ? (
          <div className="mt-5">
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#a7aec4]">
              Delivery Rider
            </label>

            <select
              id="request-action-delivery-rider"
              name="requestActionDeliveryRider"
              title="Select delivery rider"
              aria-label="Select delivery rider"
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              disabled={ridersLoading}
              className={inputClass}
            >
              <option value="" className="bg-[#11121a]">
                {ridersLoading ? "Loading riders..." : "Select rider"}
              </option>

              {riders.map((rider) => (
                <option key={rider.id} value={rider.id} className="bg-[#11121a]">
                  {rider.name || "Unnamed"}
                  {rider.phone ? ` • ${rider.phone}` : ""}
                  {rider.vehicleType ? ` • ${rider.vehicleType}` : ""}
                </option>
              ))}
            </select>

            {riders.length === 0 ? (
              <div className="mt-2 text-[12px] text-amber-200">
                No active rider found. Please activate delivery staff first.
              </div>
            ) : null}
          </div>
        ) : null}

        {activeRequestAction === "markRefunded" ? (
          <input
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            maxLength={120}
            placeholder="Transaction reference e.g. KHALTI-REF-12345"
            className="mt-5 h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
          />
        ) : null}

        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={
            riderRequired
              ? "Write pickup/delivery note for rider..."
              : "Write optional admin note..."
          }
          className="mt-5 w-full resize-none rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
        />

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={requestActionLoading}
            onClick={closeRequestActionModal}
            className={secondaryBtnClass}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={requestActionLoading}
            onClick={submitRequestAction}
            className={
              activeRequestAction === "rejectCancel" ||
              activeRequestAction === "rejectReturn"
                ? dangerBtnClass
                : primaryBtnClass
            }
          >
            {requestActionLoading ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}