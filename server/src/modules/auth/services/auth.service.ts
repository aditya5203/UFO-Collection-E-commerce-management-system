// server/src/modules/auth/services/auth.service.ts
import { User } from "../../../models";
import { RegisterDto, LoginDto, JwtPayload } from "../types/auth.types";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { AppError } from "../../../middleware/error.middleware";

// ---------------- JWT Helper ----------------
const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

// ---------------- Size Recommendation Helper ----------------
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
type Size = (typeof SIZES)[number];

const getRecommendedSizes = (
  heightFt?: number,
  weightKg?: number
): { men?: Size; women?: Size } => {
  if (!heightFt) return {};

  let men: Size;
  if (heightFt < 5.2) men = "S";
  else if (heightFt < 5.6) men = "M";
  else if (heightFt < 5.9) men = "L";
  else if (heightFt < 6.1) men = "XL";
  else men = "XXL";

  let women: Size;
  if (heightFt < 4.11) women = "XS";
  else if (heightFt < 5.2) women = "S";
  else if (heightFt < 5.5) women = "M";
  else if (heightFt < 5.8) women = "L";
  else women = "XL";

  return { men, women };
};

// ---------------- Auth Service ----------------
export const authService = {
  // ---------- Register new user (email/password) ----------
  registerUser: async (userData: RegisterDto) => {
    const email = String(userData.email || "").trim().toLowerCase();
    const name = String(userData.name || "").trim();

    if (!email || !name || !userData.password) {
      throw new AppError("Email, password, and name are required", 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const heightFt =
      userData.height !== undefined && userData.height !== null
        ? Number(userData.height)
        : undefined;

    const weightKg =
      userData.weight !== undefined && userData.weight !== null
        ? Number(userData.weight)
        : undefined;

    const { men, women } = getRecommendedSizes(
      Number.isFinite(heightFt as number) ? heightFt : undefined,
      Number.isFinite(weightKg as number) ? weightKg : undefined
    );

    // ✅ IMPORTANT: DO NOT HASH HERE (your UserSchema.pre("save") will hash)
    const user = new User({
      email,
      name,
      password: userData.password, // ✅ plain here → pre-save hook hashes it
      address: userData.address,
      role: "customer",
      provider: "credentials",

      height: Number.isFinite(heightFt as number) ? heightFt : undefined,
      weight: Number.isFinite(weightKg as number) ? weightKg : undefined,
      recommendedSizeMen: men,
      recommendedSizeWomen: women,
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: user.toJSON(), token };
  },

  // ---------- Login user (email/password) ----------
  loginUser: async (credentials: LoginDto) => {
    const email = String(credentials.email || "").trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new AppError("Invalid email or password", 401);

    // ✅ block google accounts from password login
    if (user.provider === "google") {
      throw new AppError("Use Google login for this account", 401);
    }

    const ok = await user.comparePassword(String(credentials.password || ""));
    if (!ok) throw new AppError("Invalid email or password", 401);

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: user.toJSON(), token };
  },

  // ---------- Login / Signup with Google ----------
  loginWithGoogle: async (payload: {
    email: string;
    name: string;
    providerId: string;
    avatar?: string;
  }) => {
    const email = String(payload.email || "").trim().toLowerCase();
    const name = String(payload.name || "").trim();

    let user = await User.findOne({ email });

    if (user && user.provider !== "google") {
      throw new AppError(
        "This email is already registered with email/password login.",
        409
      );
    }

    if (!user) {
      user = new User({
        email,
        name,
        provider: "google",
        providerId: payload.providerId,
        avatar: payload.avatar,
        role: "customer",
      });

      await user.save();
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: user.toJSON(), token };
  },

  // ---------- Logout user ----------
  logoutUser: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return { message: "Logged out successfully" };
  },

  // ---------- Get current user ----------
  getUserById: async (userId: string) => {
    if (!userId) return null;
    const user = await User.findById(userId);
    if (!user) return null;
    return user.toJSON();
  },

  // ---------- Update profile ----------
  updateProfile: async (
    userId: string,
    data: { name?: string; address?: string; height?: number | string; weight?: number | string }
  ) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (data.name !== undefined) user.name = String(data.name).trim();
    if (data.address !== undefined) user.address = String(data.address).trim();

    if (data.height !== undefined && data.height !== null) {
      const h = Number(data.height);
      user.height = Number.isFinite(h) ? h : undefined;
    }

    if (data.weight !== undefined && data.weight !== null) {
      const w = Number(data.weight);
      user.weight = Number.isFinite(w) ? w : undefined;
    }

    const { men, women } = getRecommendedSizes(user.height, user.weight);
    if (men) user.recommendedSizeMen = men;
    if (women) user.recommendedSizeWomen = women;

    await user.save();
    return user.toJSON();
  },

  // ---------- Initialize superadmin ----------
  initializeSuperAdmin: async (userData: {
    email: string;
    password: string;
    name: string;
  }) => {
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });
    if (existingSuperAdmin) throw new AppError("Superadmin already exists", 409);

    const email = String(userData.email || "").trim().toLowerCase();
    const name = String(userData.name || "").trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new AppError("User with this email already exists", 409);

    // ✅ IMPORTANT: DO NOT HASH HERE (pre-save hook will hash)
    const superAdmin = new User({
      email,
      name,
      password: userData.password, // plain → hashed by hook
      role: "superadmin",
      provider: "credentials",
    });

    await superAdmin.save();

    const token = generateToken({
      userId: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
    });

    return { user: superAdmin.toJSON(), token };
  },

  // ---------- Admin / Superadmin login ----------
  adminLogin: async (credentials: LoginDto) => {
    const email = String(credentials.email || "").trim().toLowerCase();

    const user = await User.findOne({
      email,
      role: { $in: ["admin", "superadmin"] },
      provider: "credentials",
    }).select("+password");

    if (!user) throw new AppError("Invalid email or password", 401);

    const ok = await user.comparePassword(String(credentials.password || ""));
    if (!ok) throw new AppError("Invalid email or password", 401);

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: user.toJSON(), token };
  },
};
