import mongoose, { Schema, Document } from "mongoose";

export type AdType = "Banner" | "Carousel" | "Pop-up" | "Video";
export type AdStatus = "Active" | "Inactive" | "Scheduled" | "Expired";
export type Audience = "All Customers" | "New Customers" | "Returning Customers";
export type AdPosition =
  | "Home Top"
  | "Home Mid"
  | "Home Bottom"
  | "Category Top"
  | "Product Page";

export interface IAd extends Document {
  title: string;
  type: AdType;
  status: AdStatus;

  startDate: Date;
  endDate: Date;

  audience: Audience;

  mediaKind: "image" | "video";

  // ✅ Old single (keep for backward compatibility)
  mediaUrl: string;
  mediaPublicId?: string | null;

  // ✅ NEW (Carousel support)
  mediaUrls?: string[];
  mediaPublicIds?: string[];

  clickUrl?: string;
  position?: AdPosition;
  priority?: number;

  createdBy?: string;
  updatedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    title: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["Banner", "Carousel", "Pop-up", "Video"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Scheduled", "Expired"],
      default: "Inactive",
      index: true,
    },

    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },

    audience: {
      type: String,
      enum: ["All Customers", "New Customers", "Returning Customers"],
      default: "All Customers",
      index: true,
    },

    mediaKind: { type: String, enum: ["image", "video"], required: true },

    // ✅ old single
    mediaUrl: { type: String, required: true },
    mediaPublicId: { type: String, default: null },

    // ✅ new multi (optional)
    mediaUrls: { type: [String], default: [] },
    mediaPublicIds: { type: [String], default: [] },

    clickUrl: { type: String, default: "" },

    position: {
      type: String,
      enum: ["Home Top", "Home Mid", "Home Bottom", "Category Top", "Product Page"],
      default: "Home Top",
      index: true,
    },

    priority: { type: Number, default: 999, index: true },

    createdBy: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Ad || mongoose.model<IAd>("Ad", AdSchema);
