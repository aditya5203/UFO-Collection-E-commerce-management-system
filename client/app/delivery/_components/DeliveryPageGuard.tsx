"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { DELIVERY_ENDPOINTS, safeJson, safeStr } from "@/app/lib/delivery";

type GuardMode = "protected" | "change-password";

const PUBLIC_DELIVERY_ROUTES = [
  "/delivery/login",
  "/delivery/forgot-password",
  "/delivery/reset-password",
];

export default function DeliveryPageGuard({
  children,
  mode = "protected",
}: {
  children: React.ReactNode;
  mode?: GuardMode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_DELIVERY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const [checking, setChecking] = React.useState(!isPublicRoute);

  React.useEffect(() => {
    if (isPublicRoute) {
      setChecking(false);
      return;
    }

    let mounted = true;

    const verify = async () => {
      try {
        const res = await fetch(DELIVERY_ENDPOINTS.me, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          router.replace("/delivery/login");
          return;
        }

        const role = safeStr((json as any)?.role || (json as any)?.data?.role);
        const mustChangePassword =
          Boolean((json as any)?.mustChangePassword) ||
          Boolean((json as any)?.data?.mustChangePassword);

        if (role && role.toLowerCase() !== "delivery") {
          router.replace("/delivery/login");
          return;
        }

        if (mode === "change-password") {
          return;
        }

        if (mustChangePassword && pathname !== "/delivery/change-password") {
          router.replace("/delivery/change-password");
          return;
        }
      } catch {
        router.replace("/delivery/login");
        return;
      } finally {
        if (mounted) setChecking(false);
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [isPublicRoute, mode, pathname, router]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#03101f] text-[13px] text-[#9ca3af]">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}