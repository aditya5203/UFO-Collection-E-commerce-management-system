// server/src/modules/admin/services/settings.service.ts
import { AdminSetting } from "../../../models/AdminSetting.model";
import {
  User,
  fullSuperadminPermissions,
  defaultAdminPermissions,
} from "../../../models/User.model";

function cleanStr(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

async function getOrCreateSettings() {
  let doc = await AdminSetting.findOne();
  if (!doc) doc = await AdminSetting.create({});
  return doc;
}

export const adminSettingsService = {
  async getSettings(adminUserId: string) {
    const [u, s] = await Promise.all([
      User.findById(adminUserId)
        .select("name email role status mustChangePassword permissions")
        .lean(),
      getOrCreateSettings(),
    ]);

    const role = String(u?.role || "admin").toLowerCase();

    return {
      profile: {
        name: u?.name || "",
        email: u?.email || "",
        role: (u?.role || "admin") as "admin" | "superadmin",
        status: u?.status || "active",
        mustChangePassword: !!u?.mustChangePassword,
        permissions:
          role === "superadmin"
            ? fullSuperadminPermissions()
            : u?.permissions || defaultAdminPermissions(),
      },
      general: {
        storeName: s?.storeName || "UFO Collection",
        supportEmail: s?.supportEmail || "",
        supportPhone: s?.supportPhone || "",
        currency: s?.currency || "NPR",
      },
    };
  },

  async updateGeneral(payload: any) {
    const s = await getOrCreateSettings();

    const storeName = cleanStr(payload?.storeName);
    const supportEmail = cleanStr(payload?.supportEmail);
    const supportPhone = cleanStr(payload?.supportPhone);
    const currency = cleanStr(payload?.currency);

    if (storeName) s.storeName = storeName;
    if (supportEmail) s.supportEmail = supportEmail;
    if (supportPhone) s.supportPhone = supportPhone;
    if (currency) s.currency = currency;

    await s.save();

    return {
      storeName: s.storeName,
      supportEmail: s.supportEmail,
      supportPhone: s.supportPhone,
      currency: s.currency,
    };
  },

  async updateProfile(adminUserId: string, payload: any) {
    const name = cleanStr(payload?.name);
    const email = cleanStr(payload?.email).toLowerCase();

    const user: any = await User.findById(adminUserId).select("name email");
    if (!user) throw new Error("Admin not found");

    if (!name) throw new Error("Name is required");
    if (!email) throw new Error("Email is required");

    const existing = await User.findOne({
      email,
      _id: { $ne: adminUserId },
    }).lean();

    if (existing) {
      throw new Error("Email is already in use");
    }

    user.name = name;
    user.email = email;

    await user.save();

    return { name: user.name, email: user.email };
  },

  async changePassword(adminUserId: string, payload: any) {
    const oldPassword = String(payload?.oldPassword || "");
    const newPassword = String(payload?.newPassword || "");

    if (!oldPassword) throw new Error("Old password is required");
    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters");
    }

    const user: any = await User.findById(adminUserId).select("+password");
    if (!user) throw new Error("Admin not found");

    const ok = await user.comparePassword(oldPassword);
    if (!ok) throw new Error("Old password is incorrect");

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return true;
  },
};