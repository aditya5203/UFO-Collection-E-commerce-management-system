export type DeliveryNavItem = {
  label: string;
  href: string;
  icon: string;
};

export const DELIVERY_NAV_ITEMS: DeliveryNavItem[] = [
  {
    label: "Dashboard",
    href: "/delivery/dashboard",
    icon: "/images/admin/dashboard.png",
  },
  {
    label: "My Orders",
    href: "/delivery/orders",
    icon: "/images/admin/order.png",
  },
  {
    label: "Profile",
    href: "/delivery/profile",
    icon: "/images/admin/customers.png",
  },
  {
    label: "Change Password",
    href: "/delivery/change-password",
    icon: "/images/admin/change-password.png",
  },
];