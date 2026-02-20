import bcrypt from "bcryptjs";
import { AdminSetting } from "../../../models/AdminSetting.model";
import { User } from "../../../models/User.model";

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
      User.findById(adminUserId).select("name email role").lean(),
      getOrCreateSettings(),
    ]);

    return {
      profile: {
        name: u?.name || "",
        email: u?.email || "",
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

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    return { name: user.name, email: user.email };
  },

  async changePassword(adminUserId: string, payload: any) {
    const oldPassword = String(payload?.oldPassword || "");
    const newPassword = String(payload?.newPassword || "");

    if (!oldPassword) throw new Error("Old password is required");
    if (!newPassword || newPassword.length < 8)
      throw new Error("New password must be at least 8 characters");

    // password is select:false in your schema
    const user: any = await User.findById(adminUserId).select("+password");
    if (!user) throw new Error("Admin not found");

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) throw new Error("Old password is incorrect");

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return true;
  },
};
