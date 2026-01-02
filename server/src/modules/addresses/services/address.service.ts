// server/src/modules/addresses/services/address.service.ts
import mongoose from "mongoose";
import { Address } from "../../../models/Address.model";

type CreateInput = {
  type?: "Shipping" | "Billing";
  label?: "Home" | "Work" | "Other";
  email?: string;
  firstName: string;
  lastName: string;
  country?: string;
  provinceId: string;
  district: string;
  cityOrMunicipality: string;
  addressLine: string;
  street?: string;
  postalCode?: string;
  phone: string;
  isDefault?: boolean;
};

function must(v: any, name: string) {
  if (!String(v || "").trim()) throw new Error(`${name} is required`);
}

export const addressService = {
  async listMine(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

    const rows = await Address.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    const mapped = (rows as any[]).map((a) => ({
      id: String(a._id),
      type: a.type,
      label: a.label,
      email: a.email || "",
      firstName: a.firstName,
      lastName: a.lastName,
      country: a.country || "Nepal",
      provinceId: a.provinceId,
      district: a.district,
      cityOrMunicipality: a.cityOrMunicipality,
      addressLine: a.addressLine,
      street: a.street || "",
      postalCode: a.postalCode || "",
      phone: a.phone,
      isDefault: Boolean(a.isDefault),
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    const shipping = mapped.filter((x) => x.type === "Shipping");
    const billing = mapped.filter((x) => x.type === "Billing");

    return { shipping, billing };
  },

  async createMine(userId: string, body: CreateInput) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");

    must(body.firstName, "firstName");
    must(body.lastName, "lastName");
    must(body.phone, "phone");
    must(body.provinceId, "provinceId");
    must(body.district, "district");
    must(body.cityOrMunicipality, "cityOrMunicipality");
    must(body.addressLine, "addressLine");

    const type = body.type || "Shipping";
    const label = body.label || "Home";

    // if creating default, unset existing default of same type
    if (body.isDefault) {
      await Address.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), type },
        { $set: { isDefault: false } }
      );
    }

    const created = await Address.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      label,
      email: body.email?.trim() || "",
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      country: (body.country || "Nepal").trim(),
      provinceId: String(body.provinceId),
      district: body.district.trim(),
      cityOrMunicipality: body.cityOrMunicipality.trim(),
      addressLine: body.addressLine.trim(),
      street: body.street?.trim() || "",
      postalCode: body.postalCode?.trim() || "",
      phone: body.phone.trim(),
      isDefault: Boolean(body.isDefault),
    });

    return {
      id: String(created._id),
      type: created.type,
      label: created.label,
      email: created.email || "",
      firstName: created.firstName,
      lastName: created.lastName,
      country: created.country || "Nepal",
      provinceId: created.provinceId,
      district: created.district,
      cityOrMunicipality: created.cityOrMunicipality,
      addressLine: created.addressLine,
      street: created.street || "",
      postalCode: created.postalCode || "",
      phone: created.phone,
      isDefault: Boolean(created.isDefault),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async updateMine(userId: string, id: string, patch: Partial<CreateInput>) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Address not found");

    const existing = await Address.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!existing) throw new Error("Address not found");

    if (patch.isDefault) {
      await Address.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), type: existing.type },
        { $set: { isDefault: false } }
      );
      existing.isDefault = true;
    }

    if (patch.type) existing.type = patch.type;
    if (patch.label) existing.label = patch.label;
    if (patch.email !== undefined) existing.email = patch.email || "";
    if (patch.firstName) existing.firstName = patch.firstName;
    if (patch.lastName) existing.lastName = patch.lastName;
    if (patch.country) existing.country = patch.country;
    if (patch.provinceId) existing.provinceId = patch.provinceId;
    if (patch.district) existing.district = patch.district;
    if (patch.cityOrMunicipality) existing.cityOrMunicipality = patch.cityOrMunicipality;
    if (patch.addressLine) existing.addressLine = patch.addressLine;
    if (patch.street !== undefined) existing.street = patch.street || "";
    if (patch.postalCode !== undefined) existing.postalCode = patch.postalCode || "";
    if (patch.phone) existing.phone = patch.phone;

    await existing.save();

    return {
      id: String(existing._id),
      type: existing.type,
      label: existing.label,
      email: existing.email || "",
      firstName: existing.firstName,
      lastName: existing.lastName,
      country: existing.country || "Nepal",
      provinceId: existing.provinceId,
      district: existing.district,
      cityOrMunicipality: existing.cityOrMunicipality,
      addressLine: existing.addressLine,
      street: existing.street || "",
      postalCode: existing.postalCode || "",
      phone: existing.phone,
      isDefault: Boolean(existing.isDefault),
      createdAt: existing.createdAt,
      updatedAt: existing.updatedAt,
    };
  },

  async deleteMine(userId: string, id: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Address not found");

    const deleted = await Address.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) throw new Error("Address not found");
    return true;
  },

  async setDefault(userId: string, id: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Address not found");

    const found = await Address.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!found) throw new Error("Address not found");

    await Address.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), type: found.type },
      { $set: { isDefault: false } }
    );

    found.isDefault = true;
    await found.save();

    return { id: String(found._id), isDefault: true };
  },
};

export default addressService;
