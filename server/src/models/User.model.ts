import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string; // optional for Google users
  role: "customer" | "admin" | "superadmin";
  address?: string;

  height?: number;
  weight?: number;
  recommendedSizeMen?: ClothingSize;
  recommendedSizeWomen?: ClothingSize;

  provider: "credentials" | "google";
  providerId?: string;
  avatar?: string;

  // ✅ Password reset fields
  resetPasswordTokenHash?: string | null;
  resetPasswordExpires?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // password required only for credentials users
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
      required: function (this: IUser) {
        return !this.provider || this.provider === "credentials";
      },
    },

    role: {
      type: String,
      default: "customer",
      enum: ["customer", "admin", "superadmin"],
    },

    address: { type: String, trim: true },

    height: { type: Number },
    weight: { type: Number },

    recommendedSizeMen: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },

    recommendedSizeWomen: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    providerId: { type: String },
    avatar: { type: String },

    // ✅ Password reset
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * ✅ FIXED: async pre hook WITHOUT next()
 */
UserSchema.pre("save", async function () {
  const user = this as IUser;

  if (!user.password) return; // google user (no password)
  if (!user.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Hide password when converting to JSON
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// ✅ avoid OverwriteModelError in dev
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
