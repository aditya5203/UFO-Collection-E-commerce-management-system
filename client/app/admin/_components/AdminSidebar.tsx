"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  AdminPermissionKey,
  AdminSettingsResponse,
  hasPermission,
  normalizeAdminPermissions,
} from "./adminPermissions";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  viewPermission: AdminPermissionKey;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "/images/admin/dashboard.png",
    viewPermission: "dashboardView",
  },
  {
    label: "Category",
    href: "/admin/category",
    icon: "/images/admin/category.png",
    viewPermission: "categoryView",
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: "/images/admin/products.png",
    viewPermission: "productView",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: "/images/admin/order.png",
    viewPermission: "orderView",
  },
  {
    label: "Delivery",
    href: "/admin/delivery",
    icon: "/images/admin/order.png",
    viewPermission: "deliveryView",
  },
  {
    label: "Delivery Staff",
    href: "/admin/delivery/staff",
    icon: "/images/admin/customers.png",
    viewPermission: "deliveryStaffView",
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: "/images/admin/customers.png",
    viewPermission: "customerView",
  },
  {
    label: "Discounts",
    href: "/admin/discounts",
    icon: "/images/admin/discount.png",
    viewPermission: "discountView",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: "/images/admin/reviews.png",
    viewPermission: "reviewView",
  },
  {
    label: "Customer Tickets",
    href: "/admin/customer-tickets",
    icon: "/images/admin/ticket.png",
    viewPermission: "ticketView",
  },
  {
    label: "Live Chat",
    href: "/admin/chat",
    icon: "/images/admin/chat.png",
    viewPermission: "liveChatView",
  },
  {
    label: "Returns & Refunds",
    href: "/admin/returns-refunds",
    icon: "/images/admin/support.png",
    viewPermission: "returnsRefundsView",
  },
  {
    label: "Advertisement",
    href: "/admin/advertisement",
    icon: "/images/admin/advertisement.png",
    viewPermission: "advertisementView",
  },
  {
    label: "Notifications",
    href: "/admin/notifications/send",
    icon: "/images/admin/notification.png",
    viewPermission: "notificationView",
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: "/images/admin/analytics.png",
    viewPermission: "analyticsView",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "/images/admin/setting.png",
    viewPermission: "settingsView",
  },
];

const BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const API_BASE = `${BASE}/api`;

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = React.useState(false);
  const [role, setRole] = React.useState<"admin" | "superadmin">("admin");
  const [allowedItems, setAllowedItems] = React.useState<NavItem[]>([]);

  React.useEffect(() => {
    let mounted = true;

    const loadPermissions = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (mounted) setAllowedItems([]);
          return;
        }

        const json = (await safeJson(res)) as AdminSettingsResponse;

        const nextRole = (json?.profile?.role || "admin") as
          | "admin"
          | "superadmin";

        const permissions = normalizeAdminPermissions(
          nextRole,
          json?.profile?.permissions
        );

        const visible = NAV_ITEMS.filter((item) =>
          hasPermission(nextRole, permissions, item.viewPermission)
        );

        if (mounted) {
          setRole(nextRole);
          setAllowedItems(visible);
        }
      } catch {
        if (mounted) setAllowedItems([]);
      }
    };

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const onAdminLogout = async () => {
    try {
      setLoggingOut(true);

      const res = await fetch(`${API_BASE}/auth/admin/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const j = await safeJson(res);
        alert((j as any)?.message || "Admin logout failed");
        return;
      }

      router.push("/admin/adminlogin");
    } catch {
      alert("Admin logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        Store Admin {role === "superadmin" ? "(Superadmin)" : ""}
      </div>

      <nav>
        <ul className="admin-nav">
          {allowedItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`admin-nav-link ${
                  isActive(item.href) ? "active" : ""
                }`}
              >
                <span className="admin-nav-icon">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={18}
                    height={18}
                  />
                </span>

                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-foot">
        <button
          type="button"
          onClick={onAdminLogout}
          disabled={loggingOut}
          className={`admin-nav-link admin-logout-btn ${
            loggingOut ? "admin-logout-btn-disabled" : ""
          }`}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

        <div className="sidebar-copyright">
          © {new Date().getFullYear()} UFO Collection
        </div>
      </div>
    </aside>
  );
}