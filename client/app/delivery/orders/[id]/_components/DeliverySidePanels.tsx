"use client";

import * as React from "react";
import {
  DeliveryOrder,
  DeliveryOtpChannel,
  formatDateTime,
  formatNPR,
  getGoogleMapsUrl,
  hasLatLng,
  safeStr,
} from "@/app/lib/delivery";
import {
  DeliveryTaskType,
  TaskStatus,
  getInitials,
  getTaskLabel,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./deliveryOrderTypes";
import {
  Field,
  LineItem,
  SidePanel,
} from "./DeliveryOrderShared";

type Props = {
  order: DeliveryOrder;
  taskType: DeliveryTaskType;
  addr: any;
  addrTitle: string;
  addrName: string;
  addrPhone: string;
  addrStreet: string;
  addrArea: string;
  addrCity: string;

  blockedByOrderStatus: boolean;
  blockedReason: string;

  allowedStatuses: TaskStatus[];
  deliveryStatus: TaskStatus;
  setDeliveryStatus: (value: TaskStatus) => void;
  deliveryNote: string;
  setDeliveryNote: (value: string) => void;
  hasStatusChanges: boolean;
  isFinalState: boolean;
  saving: boolean;
  saveChanges: () => void;

  canSendOtp: boolean;
  otpVerified: boolean;
  otpChannel: DeliveryOtpChannel;
  setOtpChannel: (value: DeliveryOtpChannel) => void;
  otpInput: string;
  setOtpInput: (value: string) => void;
  otpSending: boolean;
  otpVerifying: boolean;
  sendOtp: () => void;
  verifyOtp: () => void;
  otpSentTo: string;
  otpChannelUsed: string;
  otpExpiresAt: string;
  otpMessage: string;
  otpError: string;

  subtotalPaisa: number;
  shippingPaisa: number;
  discountPaisa: number;
  totalPaisa: number;
};

export default function DeliverySidePanels({
  order,
  taskType,
  addr,
  addrTitle,
  addrName,
  addrPhone,
  addrStreet,
  addrArea,
  addrCity,
  blockedByOrderStatus,
  blockedReason,
  allowedStatuses,
  deliveryStatus,
  setDeliveryStatus,
  deliveryNote,
  setDeliveryNote,
  hasStatusChanges,
  isFinalState,
  saving,
  saveChanges,
  canSendOtp,
  otpVerified,
  otpChannel,
  setOtpChannel,
  otpInput,
  setOtpInput,
  otpSending,
  otpVerifying,
  sendOtp,
  verifyOtp,
  otpSentTo,
  otpChannelUsed,
  otpExpiresAt,
  otpMessage,
  otpError,
  subtotalPaisa,
  shippingPaisa,
  discountPaisa,
  totalPaisa,
}: Props) {
  return (
    <div className="min-w-0 space-y-5">
      <SidePanel>
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-white/[0.05] text-base font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.12)]">
            {getInitials(order.customer?.name || addrName)}
          </div>

          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              Customer
            </div>

            <h2 className="mt-1 text-[20px] font-semibold text-white">
              Customer Details
            </h2>

            <div className="mt-4 space-y-3">
              <LineItem label="Name" value={addrName} />
              <LineItem
                label="Email"
                value={safeStr(order.customer?.email) || "-"}
              />
              <LineItem label="Phone" value={addrPhone} />
            </div>
          </div>
        </div>
      </SidePanel>

      <SidePanel>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Address
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            {addrTitle}
          </h2>

          <div className="mt-5 space-y-3">
            <LineItem label="Street" value={addrStreet || "-"} />
            <LineItem label="Area" value={addrArea || "-"} />
            <LineItem label="City" value={addrCity || "-"} />

            {hasLatLng(addr) ? (
              <LineItem
                label="Map"
                value={
                  <a
                    href={getGoogleMapsUrl(addr)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#d6c7ff] hover:text-white"
                  >
                    Open location
                  </a>
                }
              />
            ) : (
              <LineItem label="Map" value="No map location" />
            )}
          </div>
        </div>
      </SidePanel>

      <SidePanel>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Management
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Update Task Status
          </h2>

          <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
            You are updating{" "}
            <span className="font-semibold text-white">
              {getTaskLabel(taskType)}
            </span>
            . Follow the flow carefully.
          </p>

          {blockedByOrderStatus ? (
            <div className="mt-4 rounded-[16px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-6 text-red-200">
              {blockedReason}
            </div>
          ) : null}
        </div>

        <div className="mt-5 space-y-5">
          <Field label="Task Status">
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value as TaskStatus)}
              disabled={isFinalState}
              className={inputClass}
              title="Task status"
              aria-label="Task status"
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status} className="bg-[#11121a]">
                  {status}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Task Note">
            <textarea
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              disabled={isFinalState}
              rows={4}
              placeholder="Add task note, failed reason, pickup condition, landmark, etc."
              className={`${inputClass} min-h-[120px] resize-none`}
              title="Task note"
              aria-label="Task note"
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <div className="text-[12px] text-[#7f879f]">
              {hasStatusChanges
                ? "You have unsaved changes."
                : "No unsaved changes."}
            </div>

            <button
              type="button"
              onClick={saveChanges}
              disabled={saving || !hasStatusChanges || isFinalState}
              className={primaryBtnClass}
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#090a12]/30 border-t-[#090a12]" />
                  Saving
                </>
              ) : (
                "Save Status"
              )}
            </button>
          </div>
        </div>
      </SidePanel>

      <SidePanel>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Verification
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Delivery OTP Verification
          </h2>

          <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
            OTP is required only for normal customer delivery. Return pickup,
            exchange pickup, and replacement delivery can be updated using task
            status.
          </p>
        </div>

        {taskType !== "NORMAL_DELIVERY" ? (
          <div className="mt-5 rounded-[16px] border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-[13px] leading-6 text-blue-200">
            OTP is disabled for {getTaskLabel(taskType)}.
          </div>
        ) : blockedByOrderStatus ? (
          <div className="mt-5 rounded-[16px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-6 text-red-200">
            OTP is disabled. {blockedReason}
          </div>
        ) : null}

        {!canSendOtp &&
        !otpVerified &&
        !blockedByOrderStatus &&
        taskType === "NORMAL_DELIVERY" ? (
          <div className="mt-5 rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
            OTP can be sent only when delivery status is Out for Delivery.
          </div>
        ) : null}

        {otpVerified ? (
          <div className="mt-5 rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] leading-6 text-emerald-200">
            OTP already verified. This order is marked as delivered.
          </div>
        ) : null}

        <div className="mt-5 space-y-5">
          <Field label="OTP Channel">
            <select
              value={otpChannel}
              onChange={(e) => setOtpChannel(e.target.value as DeliveryOtpChannel)}
              disabled={!canSendOtp || otpVerified}
              className={inputClass}
              title="OTP channel"
              aria-label="OTP channel"
            >
              <option value="phone" className="bg-[#11121a]">
                Phone
              </option>
              <option value="email" className="bg-[#11121a]">
                Email
              </option>
            </select>
          </Field>

          <button
            type="button"
            onClick={sendOtp}
            disabled={!canSendOtp || otpVerified || otpSending}
            className={secondaryBtnClass}
          >
            {otpSending ? "Sending OTP..." : "Send OTP"}
          </button>

          <Field label="Enter OTP">
            <input
              value={otpInput}
              onChange={(e) =>
                setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              disabled={!canSendOtp || otpVerified}
              placeholder="4 digit OTP"
              inputMode="numeric"
              maxLength={4}
              className={inputClass}
              title="OTP"
              aria-label="OTP"
            />
          </Field>

          <button
            type="button"
            onClick={verifyOtp}
            disabled={
              !canSendOtp ||
              otpVerified ||
              otpVerifying ||
              otpInput.trim().length !== 4
            }
            className={primaryBtnClass}
          >
            {otpVerifying ? "Verifying..." : "Verify & Deliver"}
          </button>

          {otpSentTo || otpChannelUsed || otpExpiresAt ? (
            <div className="space-y-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
              <LineItem label="Sent To" value={otpSentTo || "-"} />
              <LineItem label="Channel" value={otpChannelUsed || "-"} />
              <LineItem
                label="Expires"
                value={otpExpiresAt ? formatDateTime(otpExpiresAt) : "-"}
              />
            </div>
          ) : null}

          {otpMessage ? (
            <div className="rounded-[16px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[13px] leading-6 text-emerald-200">
              {otpMessage}
            </div>
          ) : null}

          {otpError ? (
            <div className="rounded-[16px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-[13px] leading-6 text-red-200">
              {otpError}
            </div>
          ) : null}
        </div>
      </SidePanel>

      <SidePanel>
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
            Billing
          </div>

          <h2 className="mt-1 text-[20px] font-semibold text-white">
            Payment Summary
          </h2>
        </div>

        <div className="mt-5 space-y-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
          <LineItem label="Payment" value={safeStr(order.paymentMethod) || "-"} />
          <LineItem
            label="Payment Status"
            value={safeStr(order.paymentStatus) || "-"}
          />
          <LineItem label="Subtotal" value={formatNPR(subtotalPaisa)} />
          <LineItem label="Shipping" value={formatNPR(shippingPaisa)} />
          <LineItem
            label="Discount"
            value={`- ${formatNPR(discountPaisa)}`}
            valueClassName="text-emerald-300"
          />

          <div className="border-t border-white/10 pt-3">
            <LineItem
              label="Collection Total"
              value={formatNPR(totalPaisa)}
              valueClassName="text-base font-bold text-white"
            />
          </div>
        </div>
      </SidePanel>
    </div>
  );
}