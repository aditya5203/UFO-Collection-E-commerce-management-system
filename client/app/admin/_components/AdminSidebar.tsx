"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  // ✅ NEW: Live Chat Inbox
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

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
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

      <div className="sidebar-foot">© {new Date().getFullYear()} UFO Collection</div>
    </aside>
  );
}
