"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import DeliverySidebar from "./_components/DeliverySidebar";
import DeliveryPageGuard from "./_components/DeliveryPageGuard";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/delivery/login";
  const isChangePasswordPage = pathname === "/delivery/change-password";

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isChangePasswordPage) {
    return (
      <DeliveryPageGuard mode="change-password">
        {children}
      </DeliveryPageGuard>
    );
  }

  return (
    <DeliveryPageGuard mode="protected">
      <div className="min-h-screen bg-[#041225] text-white">
        <div className="flex min-h-screen">
          <DeliverySidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />

          <main className="min-w-0 flex-1 lg:ml-0">
            <div className="px-4 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
              <div className="overflow-hidden rounded-[22px] border border-[#0f172a] bg-[#06152b] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#0f172a] px-4 py-4 md:px-6 lg:px-8">
                  <div>
                    <h1 className="text-[18px] font-bold tracking-tight text-white md:text-[20px]">
                      Delivery Panel
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    className="inline-flex items-center rounded-xl border border-[#13203a] bg-[#020f24] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#09152c] lg:hidden"
                  >
                    Menu
                  </button>
                </div>

                <div className="px-3 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DeliveryPageGuard>
  );
}