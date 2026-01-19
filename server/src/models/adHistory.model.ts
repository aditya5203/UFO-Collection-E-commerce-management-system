import mongoose, { Schema, Document } from "mongoose";

export type HistoryAction =
  | "Created"
  | "Updated"
  | "Activated"
  | "Deactivated"
  | "Scheduled"
  | "Expired"
  | "Deleted";

export interface IAdHistory extends Document {
  adId: mongoose.Types.ObjectId;

  title: string;
  type: string;

  action: HistoryAction;
  changedBy: string;
  changedAt: Date;

  note?: string;
}

const AdHistorySchema = new Schema<IAdHistory>(
  {
    adId: { type: Schema.Types.ObjectId, ref: "Ad", required: true, index: true },

    title: { type: String, required: true },
    type: { type: String, required: true },

    action: {
      type: String,
      enum: ["Created", "Updated", "Activated", "Deactivated", "Scheduled", "Expired", "Deleted"],
      required: true,
      index: true,
    },

    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now, index: true },

    note: { type: String, default: "" },
  },
  { timestamps: false }
);

export default mongoose.models.AdHistory ||
  mongoose.model<IAdHistory>("AdHistory", AdHistorySchema);
