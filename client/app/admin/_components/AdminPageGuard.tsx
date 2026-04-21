"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AdminPermissionKey,
  AdminPermissions,
  AdminRole,
  AdminSettingsResponse,
  defaultAdminPermissions,
  hasPermission,
  normalizeAdminPermissions,
} from "./adminPermissions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default function AdminPageGuard({
  permission,
  children,
}: {
  permission: AdminPermissionKey;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = React.useState(true);
  const [allowed, setAllowed] = React.useState(false);
  const [isUnauthorized, setIsUnauthorized] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setIsUnauthorized(false);

        const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401) {
            if (mounted) {
              setAllowed(false);
              setIsUnauthorized(true);
            }
            return;
          }

          if (mounted) setAllowed(false);
          return;
        }

        const json = (await safeJson(res)) as AdminSettingsResponse;
        const role = (json?.profile?.role || "admin") as AdminRole;
        const permissions = normalizeAdminPermissions(
          role,
          json?.profile?.permissions
        );

        if (mounted) {
          setAllowed(hasPermission(role, permissions, permission));
        }
      } catch {
        if (mounted) setAllowed(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [permission]);

  React.useEffect(() => {
    if (!loading && isUnauthorized) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/admin/adminlogin${next}`);
    }
  }, [isUnauthorized, loading, pathname, router]);

  if (loading) {
    return (
      <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-6 text-sm text-[#9ca3af]">
        Checking access...
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="rounded-[14px] border border-[#111827] bg-[#020617] p-6 text-sm text-[#9ca3af]">
        Redirecting to admin login...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="rounded-[14px] border border-[#7f1d1d] bg-[rgba(127,29,29,0.12)] p-6">
        <div className="text-[22px] font-semibold text-white">403 Access Denied</div>
        <div className="mt-2 text-[14px] text-[#fca5a5]">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export type { AdminPermissions };
export { defaultAdminPermissions };