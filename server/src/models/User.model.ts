import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type UserRole = "customer" | "admin" | "superadmin";
export type AdminStatus = "active" | "inactive" | "invited";

export interface IAdminPermissions {
  dashboardView: boolean;

  customerView: boolean;
  customerEdit: boolean;
  customerDelete: boolean;

  orderView: boolean;
  orderUpdate: boolean;
  orderDelete: boolean;

  categoryView: boolean;
  categoryCreate: boolean;
  categoryEdit: boolean;
  categoryDelete: boolean;

  productView: boolean;
  productCreate: boolean;
  productEdit: boolean;
  productDelete: boolean;

  reviewView: boolean;
  reviewDelete: boolean;

  discountView: boolean;
  discountCreate: boolean;
  discountEdit: boolean;
  discountDelete: boolean;

  analyticsView: boolean;

  settingsView: boolean;

  adminsView: boolean;
  adminsCreate: boolean;
  adminsEdit: boolean;
  adminsDelete: boolean;
  adminsStatus: boolean;
  adminsResetPassword: boolean;

  notificationView: boolean;

  ticketView: boolean;
  ticketReply: boolean;
  ticketClose: boolean;

  liveChatView: boolean;
  liveChatReply: boolean;

  supportView: boolean;
  supportReply: boolean;

  advertisementView: boolean;
  advertisementCreate: boolean;
  advertisementEdit: boolean;
  advertisementDelete: boolean;
}

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  status?: AdminStatus;
  mustChangePassword?: boolean;
  permissions?: IAdminPermissions;
  address?: string;

  height?: number;
  weight?: number;
  recommendedSizeMen?: ClothingSize;
  recommendedSizeWomen?: ClothingSize;

  provider: "credentials" | "google";
  providerId?: string;
  avatar?: string;

  resetPasswordTokenHash?: string | null;
  resetPasswordExpires?: Date | null;

  isBlocked?: boolean;
  blockedAt?: Date | null;

  isDeleted?: boolean;
  deletedAt?: Date | null;

  lastLogin?: Date | null;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

export const defaultAdminPermissions = (): IAdminPermissions => ({
  dashboardView: true,

  customerView: false,
  customerEdit: false,
  customerDelete: false,

  orderView: false,
  orderUpdate: false,
  orderDelete: false,

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

export const fullSuperadminPermissions = (): IAdminPermissions => ({
  dashboardView: true,

  customerView: true,
  customerEdit: true,
  customerDelete: true,

  orderView: true,
  orderUpdate: true,
  orderDelete: true,

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

const AdminPermissionsSchema = new Schema<IAdminPermissions>(
  {
    dashboardView: { type: Boolean, default: true },

    customerView: { type: Boolean, default: false },
    customerEdit: { type: Boolean, default: false },
    customerDelete: { type: Boolean, default: false },

    orderView: { type: Boolean, default: false },
    orderUpdate: { type: Boolean, default: false },
    orderDelete: { type: Boolean, default: false },

    categoryView: { type: Boolean, default: false },
    categoryCreate: { type: Boolean, default: false },
    categoryEdit: { type: Boolean, default: false },
    categoryDelete: { type: Boolean, default: false },

    productView: { type: Boolean, default: false },
    productCreate: { type: Boolean, default: false },
    productEdit: { type: Boolean, default: false },
    productDelete: { type: Boolean, default: false },

    reviewView: { type: Boolean, default: false },
    reviewDelete: { type: Boolean, default: false },

    discountView: { type: Boolean, default: false },
    discountCreate: { type: Boolean, default: false },
    discountEdit: { type: Boolean, default: false },
    discountDelete: { type: Boolean, default: false },

    analyticsView: { type: Boolean, default: false },

    settingsView: { type: Boolean, default: false },

    adminsView: { type: Boolean, default: false },
    adminsCreate: { type: Boolean, default: false },
    adminsEdit: { type: Boolean, default: false },
    adminsDelete: { type: Boolean, default: false },
    adminsStatus: { type: Boolean, default: false },
    adminsResetPassword: { type: Boolean, default: false },

    notificationView: { type: Boolean, default: false },

    ticketView: { type: Boolean, default: false },
    ticketReply: { type: Boolean, default: false },
    ticketClose: { type: Boolean, default: false },

    liveChatView: { type: Boolean, default: false },
    liveChatReply: { type: Boolean, default: false },

    supportView: { type: Boolean, default: false },
    supportReply: { type: Boolean, default: false },

    advertisementView: { type: Boolean, default: false },
    advertisementCreate: { type: Boolean, default: false },
    advertisementEdit: { type: Boolean, default: false },
    advertisementDelete: { type: Boolean, default: false },
  },
  { _id: false }
);

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

    status: {
      type: String,
      enum: ["active", "inactive", "invited"],
      default: "active",
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
    },

    permissions: {
      type: AdminPermissionsSchema,
      default: () => defaultAdminPermissions(),
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

    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    isBlocked: { type: Boolean, default: false, index: true },
    blockedAt: { type: Date, default: null },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  const user = this as IUser;

  if (!user.password) return;
  if (!user.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

UserSchema.pre(/^find/, function () {
  // @ts-ignore
  this.where({ isDeleted: { $ne: true } });
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);