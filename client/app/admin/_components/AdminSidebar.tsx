"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "/images/admin/dashboard.png" },

  { label: "Category", href: "/admin/category", icon: "/images/admin/category.png" },
  { label: "Products", href: "/admin/products", icon: "/images/admin/products.png" },

  { label: "Orders", href: "/admin/orders", icon: "/images/admin/order.png" },
  { label: "Customers", href: "/admin/customers", icon: "/images/admin/customers.png" },

  { label: "Discounts", href: "/admin/discounts", icon: "/images/admin/discount.png" },
  { label: "Reviews", href: "/admin/reviews", icon: "/images/admin/reviews.png" },

  {
    label: "Customer Tickets",
    href: "/admin/customer-tickets",
    icon: "/images/admin/ticket.png",
  },

  {
    label: "Live Chat",
    href: "/admin/chat",
    icon: "/images/admin/chat.png",
  },

  {
    label: "Customer Support",
    href: "/admin/customer-support",
    icon: "/images/admin/support.png",
  },

  {
    label: "Advertisement",
    href: "/admin/advertisement",
    icon: "/images/admin/advertisement.png",
  },

  { label: "Analytics", href: "/admin/analytics", icon: "/images/admin/analytics.png" },
  { label: "Settings", href: "/admin/settings", icon: "/images/admin/setting.png" },
];

// ✅ FIXED API BASE (always points to /api)
const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
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

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const onAdminLogout = async () => {
    try {
      setLoggingOut(true);

      const res = await fetch(`${API_BASE}/auth/admin/logout`, {
        method: "POST",
        credentials: "include", // ✅ must include cookies
      });

      if (!res.ok) {
        const j = await safeJson(res);
        alert(j?.message || "Admin logout failed");
        return;
      }

      router.push("/admin/adminlogin");
    } catch (e) {
      alert("Admin logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">Store Admin</div>

      <nav>
        <ul className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`admin-nav-link ${isActive(item.href) ? "active" : ""}`}
              >
                <span className="admin-nav-icon">
                  <Image src={item.icon} alt={item.label} width={18} height={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ✅ Logout button (bottom) */}
      <div className="sidebar-foot">
        <button
          type="button"
          onClick={onAdminLogout}
          disabled={loggingOut}
          className="admin-nav-link"
          style={{
            width: "100%",
            justifyContent: "center",
            border: "1px solid #1f2937",
            background: loggingOut ? "#111827" : "transparent",
            cursor: loggingOut ? "not-allowed" : "pointer",
          }}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>

        <div style={{ marginTop: 10 }}>© {new Date().getFullYear()} UFO Collection</div>
      </div>
    </aside>
  );
}
