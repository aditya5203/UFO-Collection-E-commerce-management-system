"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";
import { DELIVERY_NAV_ITEMS } from "./deliveryNavItems";

type Props = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function DeliverySidebar({
  mobileOpen = false,
  onClose,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const onLogout = async () => {
    try {
      setLoggingOut(true);

      const res = await fetch(DELIVERY_ENDPOINTS.logout, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const json = await safeJson(res);
        alert((json as any)?.message || "Logout failed");
        return;
      }

      router.replace("/delivery/login");
      router.refresh();
      onClose?.();
    } catch {
      alert("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] shrink-0 flex-col border-r border-[#0c1630] bg-[#020b1d] transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 pb-5 pt-8">
          <h2 className="text-[17px] font-extrabold tracking-[0.01em] text-white">
            Delivery Panel
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <nav>
            <ul className="space-y-3">
              {DELIVERY_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex min-h-[54px] items-center gap-3 rounded-[18px] px-4 text-[14px] font-medium transition-all duration-200 ${
                        active
                          ? "border border-[#1b2945] bg-[#0a1730] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
                          : "border border-transparent text-white hover:bg-[#071226]"
                      }`}
                    >
                      <span className="flex h-[21px] w-[21px] items-center justify-center">
                        <Image
                          src={item.icon}
                          alt={item.label}
                          width={19}
                          height={19}
                          className="object-contain opacity-95"
                        />
                      </span>

                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="px-3 pb-6 pt-6">
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex min-h-[54px] w-full items-center gap-3 rounded-[18px] border border-transparent px-4 text-left text-[14px] font-medium text-white transition hover:bg-[#071226] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-[21px] w-[21px] items-center justify-center">
              <Image
                src="/images/delivery/log out.png"
                alt="Logout"
                width={19}
                height={19}
                className="object-contain opacity-95"
              />
            </span>

            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>

          <div className="mt-10 flex items-center gap-3 px-2">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#13203a] bg-[#020f24] text-[17px] text-white">
              N
            </div>

            <div className="min-w-0">
              <div className="truncate text-[13px] text-[#7f8aa3]">
                UFO Collection
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}