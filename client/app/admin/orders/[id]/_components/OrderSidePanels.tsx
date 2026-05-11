"use client";

import Link from "next/link";
import * as React from "react";
import {
  AdminOrderDetail,
  DeliveryAssignmentStatus,
  OrderAddress,
  OrderStatus,
  PaymentStatus,
  RiderRow,
  formatDateTime,
  formatNPR,
  getGoogleMapsUrl,
  getInitials,
  hasLatLng,
  inputClass,
  safeStr,
  secondaryBtnClass,
  primaryBtnClass,
} from "./orderDetailsTypes";
import {
  Field,
  InfoPanel,
  LineItem,
  StatusPill,
} from "./OrderDetailsShared";

type Props = {
  order: AdminOrderDetail;
  addr: OrderAddress | null;
  riders: RiderRow[];
  ridersLoading: boolean;
  canUpdate: boolean;

  paymentStatus: PaymentStatus;
  setPaymentStatus: (status: PaymentStatus) => void;
  orderStatus: OrderStatus;
  setOrderStatus: (status: OrderStatus) => void;

  deliveryManId: string;
  setDeliveryManId: (value: string) => void;
  deliveryNote: string;
  setDeliveryNote: (value: string) => void;
  deliveryStatus: DeliveryAssignmentStatus;
  setDeliveryStatus: (status: DeliveryAssignmentStatus) => void;

  otpVerified: boolean;
  deliveredBlocked: boolean;
  deliveryChanged: boolean;
  hasChanges: boolean;
  saving: boolean;
  saveChanges: () => void;

  subtotalPaisa: number;
  shippingPaisa: number;
  discountPaisa: number;
  totalPaisa: number;
};

export default function OrderSidePanels({
  order,
  addr,
  riders,
  ridersLoading,
  canUpdate,
  paymentStatus,
  setPaymentStatus,
  orderStatus,
  setOrderStatus,
  deliveryManId,
  setDeliveryManId,
  deliveryNote,
  setDeliveryNote,
  deliveryStatus,
  setDeliveryStatus,
  otpVerified,
  deliveredBlocked,
  deliveryChanged,
  hasChanges,
  saving,
  saveChanges,
  subtotalPaisa,
  shippingPaisa,
  discountPaisa,
  totalPaisa,
}: Props) {
  const addrTitle = addr?.label ? safeStr(addr.label) : "Shipping Address";
  const addrName = safeStr(addr?.fullName);
  const addrPhone = safeStr(addr?.phone);
  const addrStreet = safeStr(addr?.street);
  const addrArea =
    safeStr(addr?.addressLine) ||
    safeStr(addr?.area) ||
    safeStr(addr?.district);
  const addrCity =
    safeStr(addr?.cityOrMunicipality) ||
    safeStr(addr?.city) ||
    safeStr(addr?.provinceId);

  const assignedRiderName =
    safeStr(order?.deliveryAssignment?.name) || "Not assigned";
  const assignedRiderPhone = safeStr(order?.deliveryAssignment?.phone);
  const assignedRiderVehicle = safeStr(order?.deliveryAssignment?.vehicleType);
  const assignedAt = order?.deliveryAssignment?.assignedAt
    ? formatDateTime(order?.deliveryAssignment?.assignedAt)
    : "-";

  return (
    <div className="space-y-6">
      <InfoPanel title="Customer Details" eyebrow="Customer">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-white/5 text-[15px] font-bold text-white">
            {getInitials(order.customer?.name)}
          </div>

          <div className="min-w-0">
            <div className="font-semibold text-white">
              {order.customer?.name || "-"}
            </div>

            <div className="mt-1 break-all text-[13px] text-[#a7aec4]">
              {order.customer?.email || "-"}
            </div>

            {order.customer?.phone ? (
              <div className="mt-1 text-[13px] text-[#a7aec4]">
                {order.customer.phone}
              </div>
            ) : null}
          </div>
        </div>
      </InfoPanel>

      <InfoPanel title={addrTitle} eyebrow="Delivery Address">
        {!addr ? (
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4 text-[13px] text-[#a7aec4]">
            {order.shippingAddress || "No shipping address found."}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold text-white">{addrName || "-"}</div>

              {addrPhone ? (
                <div className="mt-1 text-[13px] text-[#a7aec4]">
                  {addrPhone}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <LineItem label="Street" value={addrStreet || "-"} />
                <LineItem label="Area" value={addrArea || "-"} />
                <LineItem label="City" value={addrCity || "-"} />
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
                Map Location
              </div>

              <div
                className={`mt-2 text-[13px] ${
                  hasLatLng(addr) ? "text-white" : "text-[#7f879f]"
                }`}
              >
                {hasLatLng(addr)
                  ? `${Number(addr.lat).toFixed(6)}, ${Number(addr.lng).toFixed(
                      6
                    )}`
                  : "No map location saved in this order"}
              </div>

              {hasLatLng(addr) ? (
                <a
                  href={getGoogleMapsUrl(addr)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secondaryBtnClass} mt-4 inline-flex`}
                >
                  View Map
                </a>
              ) : null}
            </div>
          </div>
        )}
      </InfoPanel>

      <InfoPanel title="Normal Delivery Assignment" eyebrow="Rider">
        <div className="space-y-5">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[13px] font-semibold text-white">
              Current Rider
            </div>

            <div className="mt-2 text-[13px] text-[#a7aec4]">
              {assignedRiderName}
            </div>

            <div className="mt-1 text-[13px] text-[#7f879f]">
              {assignedRiderPhone || "-"}
            </div>

            <div className="mt-1 text-[12px] text-[#7f879f]">
              {assignedRiderVehicle || "-"}
            </div>

            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <LineItem label="Assigned At" value={assignedAt} />

              <LineItem
                label="Delivery Status"
                value={
                  order?.deliveryAssignment?.status ? (
                    <StatusPill>{order.deliveryAssignment.status}</StatusPill>
                  ) : (
                    "-"
                  )
                }
              />

              <LineItem
                label="OTP Verified"
                value={otpVerified ? "Yes" : "No"}
                valueClassName={otpVerified ? "text-emerald-300" : "text-[#a7aec4]"}
              />
            </div>
          </div>

          <Field label="Delivery Rider" htmlFor="delivery-rider">
            <select
              id="delivery-rider"
              name="deliveryRider"
              title="Delivery rider"
              aria-label="Delivery rider"
              value={deliveryManId}
              onChange={(e) => setDeliveryManId(e.target.value)}
              disabled={!canUpdate || ridersLoading}
              className={inputClass}
            >
              <option value="" className="bg-[#11121a]">
                {ridersLoading ? "Loading riders..." : "Select delivery rider"}
              </option>

              {riders.map((rider) => (
                <option key={rider.id} value={rider.id} className="bg-[#11121a]">
                  {rider.name || "Unnamed"} {rider.area ? `- ${rider.area}` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Delivery Status" htmlFor="delivery-status">
            <select
              id="delivery-status"
              name="deliveryStatus"
              title="Delivery status"
              aria-label="Delivery status"
              value={deliveryStatus}
              onChange={(e) =>
                setDeliveryStatus(e.target.value as DeliveryAssignmentStatus)
              }
              disabled={!canUpdate}
              className={inputClass}
            >
              <option value="Assigned" className="bg-[#11121a]">
                Assigned
              </option>
              <option value="Picked Up" className="bg-[#11121a]">
                Picked Up
              </option>
              <option value="Out for Delivery" className="bg-[#11121a]">
                Out for Delivery
              </option>
              <option
                value="Delivered"
                className="bg-[#11121a]"
                disabled={deliveredBlocked}
              >
                Delivered {deliveredBlocked ? "(OTP required)" : ""}
              </option>
              <option value="Failed Delivery" className="bg-[#11121a]">
                Failed Delivery
              </option>
              <option value="Returned" className="bg-[#11121a]">
                Returned
              </option>
            </select>
          </Field>

          <Field label="Delivery Note" htmlFor="delivery-note">
            <textarea
              id="delivery-note"
              name="deliveryNote"
              title="Delivery note"
              aria-label="Delivery note"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              disabled={!canUpdate}
              rows={4}
              placeholder="Call customer before arrival, gate instructions, landmark, etc."
              className={`${inputClass} min-h-[110px] resize-none py-3`}
            />
          </Field>
        </div>
      </InfoPanel>

      <InfoPanel title="Payment & Totals" eyebrow="Billing">
        <div className="space-y-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
          <LineItem label="Payment Method" value={safeStr(order?.paymentMethod) || "-"} />
          <LineItem label="Payment Reference" value={safeStr(order?.paymentRef) || "-"} />
          <LineItem label="Subtotal" value={formatNPR(subtotalPaisa)} />
          <LineItem label="Shipping" value={formatNPR(shippingPaisa)} />
          <LineItem
            label="Discount"
            value={`- ${formatNPR(discountPaisa)}`}
            valueClassName="text-emerald-300"
          />

          <div className="border-t border-white/10 pt-3">
            <LineItem
              label="Total"
              value={formatNPR(totalPaisa)}
              valueClassName="text-[16px] font-bold text-white"
            />
          </div>
        </div>
      </InfoPanel>

      <InfoPanel title="Update Order" eyebrow="Management">
        <div className="mb-5 flex justify-end">
          {canUpdate ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              Editable
            </span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[#a7aec4]">
              Read only
            </span>
          )}
        </div>

        <div className="space-y-5">
          <Field label="Payment Status" htmlFor="order-payment-status">
            <select
              id="order-payment-status"
              name="orderPaymentStatus"
              title="Payment status"
              aria-label="Payment status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              disabled={!canUpdate}
              className={inputClass}
            >
              <option value="Paid" className="bg-[#11121a]">
                Paid
              </option>
              <option value="Pending" className="bg-[#11121a]">
                Pending
              </option>
              <option value="Failed" className="bg-[#11121a]">
                Failed
              </option>
            </select>
          </Field>

          <Field label="Order Status" htmlFor="order-status">
            <select
              id="order-status"
              name="orderStatus"
              title="Order status"
              aria-label="Order status"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              disabled={!canUpdate}
              className={inputClass}
            >
              <option value="Pending" className="bg-[#11121a]">
                Pending
              </option>
              <option value="Confirmed" className="bg-[#11121a]">
                Confirmed
              </option>
              <option value="Processing" className="bg-[#11121a]">
                Processing
              </option>
              <option value="Shipped" className="bg-[#11121a]">
                Shipped
              </option>
              <option value="Transit" className="bg-[#11121a]">
                Transit
              </option>
              <option
                value="Delivered"
                className="bg-[#11121a]"
                disabled={deliveredBlocked}
              >
                Delivered {deliveredBlocked ? "(OTP required)" : ""}
              </option>
              <option value="Cancelled" className="bg-[#11121a]">
                Cancelled
              </option>
              <option value="Returned" className="bg-[#11121a]">
                Returned
              </option>
              <option value="Refunded" className="bg-[#11121a]">
                Refunded
              </option>
            </select>
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <Link href="/admin/orders" className={secondaryBtnClass}>
              Back
            </Link>

            {canUpdate ? (
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving || !hasChanges}
                className={primaryBtnClass}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <div className="text-[13px] text-[#a7aec4]">
                Update permission required
              </div>
            )}
          </div>

          {deliveryChanged && !deliveryManId ? (
            <div className="rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
              Select a delivery rider before saving delivery assignment changes.
            </div>
          ) : null}

          {!hasChanges ? (
            <div className="text-[12px] text-[#7f879f]">No unsaved changes.</div>
          ) : null}
        </div>
      </InfoPanel>
    </div>
  );
}