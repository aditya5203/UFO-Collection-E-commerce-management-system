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
  lat?: number;
  lng?: number;
};

function must(v: any, name: string) {
  if (!String(v || "").trim()) throw new Error(`${name} is required`);
}

function normalizeNumber(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function mapAddress(a: any) {
  return {
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
    lat:
      typeof a.lat === "number" && Number.isFinite(a.lat) ? a.lat : undefined,
    lng:
      typeof a.lng === "number" && Number.isFinite(a.lng) ? a.lng : undefined,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export const addressService = {
  async listMine(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    const rows = await Address.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    const mapped = (rows as any[]).map(mapAddress);

    const shipping = mapped.filter((x) => x.type === "Shipping");
    const billing = mapped.filter((x) => x.type === "Billing");

    return { shipping, billing };
  },

  async createMine(userId: string, body: CreateInput) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }

    must(body.firstName, "firstName");
    must(body.lastName, "lastName");
    must(body.phone, "phone");
    must(body.provinceId, "provinceId");
    must(body.district, "district");
    must(body.cityOrMunicipality, "cityOrMunicipality");
    must(body.addressLine, "addressLine");

    const type = body.type || "Shipping";
    const label = body.label || "Home";
    const lat = normalizeNumber(body.lat);
    const lng = normalizeNumber(body.lng);

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
      provinceId: String(body.provinceId).trim(),
      district: body.district.trim(),
      cityOrMunicipality: body.cityOrMunicipality.trim(),
      addressLine: body.addressLine.trim(),
      street: body.street?.trim() || "",
      postalCode: body.postalCode?.trim() || "",
      phone: body.phone.trim(),
      isDefault: Boolean(body.isDefault),
      lat,
      lng,
    });

    return mapAddress(created);
  },

  async updateMine(userId: string, id: string, patch: Partial<CreateInput>) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Address not found");
    }

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
    if (patch.firstName) existing.firstName = patch.firstName.trim();
    if (patch.lastName) existing.lastName = patch.lastName.trim();
    if (patch.country) existing.country = patch.country.trim();
    if (patch.provinceId) existing.provinceId = String(patch.provinceId).trim();
    if (patch.district) existing.district = patch.district.trim();
    if (patch.cityOrMunicipality) {
      existing.cityOrMunicipality = patch.cityOrMunicipality.trim();
    }
    if (patch.addressLine) existing.addressLine = patch.addressLine.trim();
    if (patch.street !== undefined) existing.street = patch.street?.trim() || "";
    if (patch.postalCode !== undefined) {
      existing.postalCode = patch.postalCode?.trim() || "";
    }
    if (patch.phone) existing.phone = patch.phone.trim();

    if (patch.lat !== undefined) {
      existing.lat = normalizeNumber(patch.lat);
    }
    if (patch.lng !== undefined) {
      existing.lng = normalizeNumber(patch.lng);
    }

    await existing.save();

    return mapAddress(existing);
  },

  async deleteMine(userId: string, id: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Address not found");
    }

    const deleted = await Address.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) throw new Error("Address not found");
    return true;
  },

  async setDefault(userId: string, id: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Address not found");
    }

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

    return {
      id: String(found._id),
      isDefault: true,
    };
  },
};

export default addressService;