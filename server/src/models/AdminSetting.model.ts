import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSetting extends Document {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingSchema = new Schema<IAdminSetting>(
  {
    storeName: { type: String, default: "UFO Collection" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    currency: { type: String, default: "NPR" },
  },
  { timestamps: true }
);

export const AdminSetting =
  mongoose.models.AdminSetting ||
  mongoose.model<IAdminSetting>("AdminSetting", AdminSettingSchema);