// models/Address.model.ts
import { Schema, model, Types, Document } from "mongoose";

export type AddressType = "Shipping" | "Billing";
export type AddressLabel = "Home" | "Work" | "Other";

export interface IAddress extends Document {
  userId: Types.ObjectId;
  type: AddressType;
  label?: AddressLabel;

  // checkout fields
  email?: string;
  firstName: string;
  lastName: string;

  country: string; // Nepal
  provinceId: string;
  district: string;
  cityOrMunicipality: string;

  addressLine: string; // "Address"
  street?: string;
  postalCode?: string;
  phone: string;

  isDefault?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: { type: String, enum: ["Shipping", "Billing"], default: "Shipping" },
    label: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },

    email: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    country: { type: String, default: "Nepal" },
    provinceId: { type: String, required: true },
    district: { type: String, required: true },
    cityOrMunicipality: { type: String, required: true },

    addressLine: { type: String, required: true, trim: true },
    street: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },

    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = model<IAddress>("Address", addressSchema);
