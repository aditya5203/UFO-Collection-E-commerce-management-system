"use client";

import * as React from "react";
import {
  CustomerRow,
  CustomerStatus,
  formatDateShort,
  panelClass,
} from "./customerDetailsTypes";
import { CustomerStatusPill, InfoBlock } from "./CustomerShared";

type Props = {
  customer: CustomerRow;
  customerStatus: CustomerStatus;
};

export default function CustomerOverview({ customer, customerStatus }: Props) {
  return (
    <section className={`${panelClass} p-5 sm:p-6`}>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
          Overview
        </div>

        <h2 className="mt-1 text-[20px] font-semibold text-white">
          Customer Profile
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoBlock label="Full Name" value={customer.name} />
        <InfoBlock label="Email" value={customer.email} />
        <InfoBlock label="Role" value={customer.role || "customer"} />
        <InfoBlock
          label="Status"
          value={<CustomerStatusPill status={customerStatus} />}
        />
        <InfoBlock label="Created At" value={formatDateShort(customer.createdAt)} />
        <InfoBlock label="Last Login" value={formatDateShort(customer.lastLogin)} />

        {customerStatus === "deleted" ? (
          <InfoBlock
            label="Deleted At"
            value={formatDateShort(customer.deletedAt)}
          />
        ) : null}
      </div>
    </section>
  );
}