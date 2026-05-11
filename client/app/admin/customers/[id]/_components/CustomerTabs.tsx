"use client";

import * as React from "react";
import { panelClass, TabKey } from "./customerDetailsTypes";
import { TabButton } from "./CustomerShared";

type Props = {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  canViewOrders: boolean;
  canViewTickets: boolean;
  ordersCount: number;
  ticketsCount: number;
  addressesCount: number;
};

export default function CustomerTabs({
  tab,
  setTab,
  canViewOrders,
  canViewTickets,
  ordersCount,
  ticketsCount,
  addressesCount,
}: Props) {
  return (
    <section className={`${panelClass} p-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>

        {canViewOrders ? (
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>
            Orders <span className="ml-2 opacity-70">({ordersCount})</span>
          </TabButton>
        ) : null}

        {canViewTickets ? (
          <TabButton active={tab === "tickets"} onClick={() => setTab("tickets")}>
            Tickets{" "}
            <span className="ml-2 opacity-70">
              ({tab === "tickets" ? ticketsCount : "—"})
            </span>
          </TabButton>
        ) : null}

        <TabButton active={tab === "addresses"} onClick={() => setTab("addresses")}>
          Addresses{" "}
          <span className="ml-2 opacity-70">
            ({tab === "addresses" ? addressesCount : "—"})
          </span>
        </TabButton>
      </div>
    </section>
  );
}