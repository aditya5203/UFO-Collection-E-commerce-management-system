export type AdminPermissionKey =
  | "dashboardView"
  | "customerView"
  | "customerEdit"
  | "customerDelete"
  | "orderView"
  | "orderUpdate"
  | "orderDelete"
  | "deliveryView"
  | "deliveryUpdate"
  | "deliveryStaffView"
  | "deliveryStaffCreate"
  | "deliveryStaffEdit"
  | "deliveryStaffDelete"
  | "categoryView"
  | "categoryCreate"
  | "categoryEdit"
  | "categoryDelete"
  | "productView"
  | "productCreate"
  | "productEdit"
  | "productDelete"
  | "reviewView"
  | "reviewDelete"
  | "discountView"
  | "discountCreate"
  | "discountEdit"
  | "discountDelete"
  | "analyticsView"
  | "settingsView"
  | "adminsView"
  | "adminsCreate"
  | "adminsEdit"
  | "adminsDelete"
  | "adminsStatus"
  | "adminsResetPassword"
  | "notificationView"
  | "notificationSend"
  | "ticketView"
  | "ticketReply"
  | "ticketClose"
  | "liveChatView"
  | "liveChatReply"
  | "supportView"
  | "supportReply"
  | "advertisementView"
  | "advertisementCreate"
  | "advertisementEdit"
  | "advertisementDelete";

export type AdminPermissions = Record<AdminPermissionKey, boolean>;

export type AdminRole = "admin" | "superadmin";

export const defaultAdminPermissions = (): AdminPermissions => ({
  dashboardView: true,

  customerView: false,
  customerEdit: false,
  customerDelete: false,

  orderView: false,
  orderUpdate: false,
  orderDelete: false,

  deliveryView: false,
  deliveryUpdate: false,

  deliveryStaffView: false,
  deliveryStaffCreate: false,
  deliveryStaffEdit: false,
  deliveryStaffDelete: false,

  categoryView: false,
  categoryCreate: false,
  categoryEdit: false,
  categoryDelete: false,

  productView: false,
  productCreate: false,
  productEdit: false,
  productDelete: false,

  reviewView: false,
  reviewDelete: false,

  discountView: false,
  discountCreate: false,
  discountEdit: false,
  discountDelete: false,

  analyticsView: false,

  settingsView: false,

  adminsView: false,
  adminsCreate: false,
  adminsEdit: false,
  adminsDelete: false,
  adminsStatus: false,
  adminsResetPassword: false,

  notificationView: false,
  notificationSend: false,

  ticketView: false,
  ticketReply: false,
  ticketClose: false,

  liveChatView: false,
  liveChatReply: false,

  supportView: false,
  supportReply: false,

  advertisementView: false,
  advertisementCreate: false,
  advertisementEdit: false,
  advertisementDelete: false,
});

export const fullSuperadminPermissions = (): AdminPermissions => ({
  dashboardView: true,

  customerView: true,
  customerEdit: true,
  customerDelete: true,

  orderView: true,
  orderUpdate: true,
  orderDelete: true,

  deliveryView: true,
  deliveryUpdate: true,

  deliveryStaffView: true,
  deliveryStaffCreate: true,
  deliveryStaffEdit: true,
  deliveryStaffDelete: true,

  categoryView: true,
  categoryCreate: true,
  categoryEdit: true,
  categoryDelete: true,

  productView: true,
  productCreate: true,
  productEdit: true,
  productDelete: true,

  reviewView: true,
  reviewDelete: true,

  discountView: true,
  discountCreate: true,
  discountEdit: true,
  discountDelete: true,

  analyticsView: true,

  settingsView: true,

  adminsView: true,
  adminsCreate: true,
  adminsEdit: true,
  adminsDelete: true,
  adminsStatus: true,
  adminsResetPassword: true,

  notificationView: true,
  notificationSend: true,

  ticketView: true,
  ticketReply: true,
  ticketClose: true,

  liveChatView: true,
  liveChatReply: true,

  supportView: true,
  supportReply: true,

  advertisementView: true,
  advertisementCreate: true,
  advertisementEdit: true,
  advertisementDelete: true,
});

export function normalizeAdminPermissions(
  role?: string,
  permissions?: Partial<AdminPermissions> | null
): AdminPermissions {
  if (String(role || "").toLowerCase() === "superadmin") {
    return fullSuperadminPermissions();
  }

  const base = defaultAdminPermissions();
  const input = permissions || {};

  return {
    ...base,
    ...input,
  };
}

export function hasPermission(
  role: string | undefined,
  permissions: Partial<AdminPermissions> | null | undefined,
  key: AdminPermissionKey
) {
  if (String(role || "").toLowerCase() === "superadmin") return true;
  return Boolean(normalizeAdminPermissions(role, permissions)[key]);
}

export type AdminProfilePayload = {
  name?: string;
  email?: string;
  role?: AdminRole;
  status?: "active" | "inactive" | "invited";
  mustChangePassword?: boolean;
  permissions?: Partial<AdminPermissions>;
};

export type AdminSettingsResponse = {
  profile?: AdminProfilePayload;
  general?: {
    storeName?: string;
    supportEmail?: string;
    supportPhone?: string;
    currency?: string;
  };
};

export const ADMIN_PERMISSION_GROUPS: {
  title: string;
  items: { key: AdminPermissionKey; label: string }[];
}[] = [
  {
    title: "Dashboard",
    items: [{ key: "dashboardView", label: "Dashboard View" }],
  },
  {
    title: "Customers",
    items: [
      { key: "customerView", label: "Customer View" },
      { key: "customerEdit", label: "Customer Edit" },
      { key: "customerDelete", label: "Customer Delete" },
    ],
  },
  {
    title: "Orders",
    items: [
      { key: "orderView", label: "Order View" },
      { key: "orderUpdate", label: "Order Update" },
      { key: "orderDelete", label: "Order Delete" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { key: "deliveryView", label: "Delivery View" },
      { key: "deliveryUpdate", label: "Delivery Update / Assign Orders" },
    ],
  },
  {
    title: "Delivery Staff",
    items: [
      { key: "deliveryStaffView", label: "Delivery Staff View" },
      { key: "deliveryStaffCreate", label: "Delivery Staff Create" },
      { key: "deliveryStaffEdit", label: "Delivery Staff Edit" },
      { key: "deliveryStaffDelete", label: "Delivery Staff Delete" },
    ],
  },
  {
    title: "Categories",
    items: [
      { key: "categoryView", label: "Category View" },
      { key: "categoryCreate", label: "Category Create" },
      { key: "categoryEdit", label: "Category Edit" },
      { key: "categoryDelete", label: "Category Delete" },
    ],
  },
  {
    title: "Products",
    items: [
      { key: "productView", label: "Product View" },
      { key: "productCreate", label: "Product Create" },
      { key: "productEdit", label: "Product Edit" },
      { key: "productDelete", label: "Product Delete" },
    ],
  },
  {
    title: "Reviews",
    items: [
      { key: "reviewView", label: "Review View" },
      { key: "reviewDelete", label: "Review Delete" },
    ],
  },
  {
    title: "Discounts",
    items: [
      { key: "discountView", label: "Discount View" },
      { key: "discountCreate", label: "Discount Create" },
      { key: "discountEdit", label: "Discount Edit" },
      { key: "discountDelete", label: "Discount Delete" },
    ],
  },
  {
    title: "Analytics",
    items: [{ key: "analyticsView", label: "Analytics View" }],
  },
  {
    title: "Settings",
    items: [{ key: "settingsView", label: "Settings View" }],
  },
  {
    title: "Admins",
    items: [
      { key: "adminsView", label: "Admins View" },
      { key: "adminsCreate", label: "Admins Create" },
      { key: "adminsEdit", label: "Admins Edit Permissions" },
      { key: "adminsDelete", label: "Admins Delete" },
      { key: "adminsStatus", label: "Admins Active/Inactive" },
      { key: "adminsResetPassword", label: "Admins Reset Password" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { key: "notificationView", label: "Notification View" },
      { key: "notificationSend", label: "Notification Send" },
    ],
  },
  {
    title: "Tickets",
    items: [
      { key: "ticketView", label: "Ticket View" },
      { key: "ticketReply", label: "Ticket Reply" },
      { key: "ticketClose", label: "Ticket Close" },
    ],
  },
  {
    title: "Live Chat",
    items: [
      { key: "liveChatView", label: "Live Chat View" },
      { key: "liveChatReply", label: "Live Chat Reply" },
    ],
  },
  {
    title: "Support",
    items: [
      { key: "supportView", label: "Support View" },
      { key: "supportReply", label: "Support Reply" },
    ],
  },
  {
    title: "Advertisement",
    items: [
      { key: "advertisementView", label: "Advertisement View" },
      { key: "advertisementCreate", label: "Advertisement Create" },
      { key: "advertisementEdit", label: "Advertisement Edit" },
      { key: "advertisementDelete", label: "Advertisement Delete" },
    ],
  },
];