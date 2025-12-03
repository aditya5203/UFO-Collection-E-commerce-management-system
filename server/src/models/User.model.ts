import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;                          // 👈 optional now
  role: 'customer' | 'admin' | 'superadmin';
  address?: string;

  // Size fields
  height?: number;
  weight?: number;
  recommendedSizeMen?: ClothingSize;
  recommendedSizeWomen?: ClothingSize;

  // 🔹 Social auth fields
  provider: 'credentials' | 'google';
  providerId?: string;
  avatar?: string;

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // ⚠️ password required only for normal accounts
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
      required: function (this: IUser) {
        return this.provider === 'credentials';
      },
    },

    role: {
      type: String,
      default: 'customer',
      enum: ['customer', 'admin', 'superadmin'],
    },
    address: {
      type: String,
      trim: true,
    },

    height: { type: Number },
    weight: { type: Number },
    recommendedSizeMen: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
    recommendedSizeWomen: {
      type: String,
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },

    // 🔹 Social auth fields
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
    },
    providerId: { type: String },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;        // 👈 for Google-only users
  return bcrypt.compare(candidatePassword, this.password);
};

// Hide password when converting to JSON
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = mongoose.model<IUser>('User', UserSchema);
