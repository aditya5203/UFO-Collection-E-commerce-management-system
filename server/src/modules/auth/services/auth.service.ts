import { User } from "../../../models";
import { RegisterDto, LoginDto, JwtPayload } from "../types/auth.types";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { AppError } from "../../../middleware/error.middleware";
import { fullSuperadminPermissions } from "../../../models/User.model";

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
type Size = (typeof SIZES)[number];

const getRecommendedSizes = (
  heightFt?: number,
  _weightKg?: number
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

const sanitizeUserForResponse = (user: any) => {
  const plain = typeof user.toJSON === "function" ? user.toJSON() : user;
  const role = String(plain.role || "").toLowerCase();

  return {
    _id: plain._id,
    email: plain.email,
    name: plain.name,
    role: plain.role,
    status: plain.status || "active",
    mustChangePassword: !!plain.mustChangePassword,
    permissions:
      role === "superadmin"
        ? fullSuperadminPermissions()
        : plain.permissions || {},
    address: plain.address,
    height: plain.height,
    weight: plain.weight,
    recommendedSizeMen: plain.recommendedSizeMen,
    recommendedSizeWomen: plain.recommendedSizeWomen,
    provider: plain.provider,
    providerId: plain.providerId,
    avatar: plain.avatar,
    isBlocked: !!plain.isBlocked,
    blockedAt: plain.blockedAt || null,
    isDeleted: !!plain.isDeleted,
    deletedAt: plain.deletedAt || null,
    lastLogin: plain.lastLogin || null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const authService = {
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

    const user = new User({
      email,
      name,
      password: userData.password,
      address: userData.address,
      role: "customer",
      provider: "credentials",
      height: Number.isFinite(heightFt as number) ? heightFt : undefined,
      weight: Number.isFinite(weightKg as number) ? weightKg : undefined,
      recommendedSizeMen: men,
      recommendedSizeWomen: women,
      isBlocked: false,
      blockedAt: null,
      isDeleted: false,
      deletedAt: null,
      lastLogin: new Date(),
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return {
      user: sanitizeUserForResponse(user),
      token,
      isNewUser: true,
    };
  },

  loginUser: async (credentials: LoginDto) => {
    const email = String(credentials.email || "").trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new AppError("Invalid email or password", 401);

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("Your account has been blocked by admin.", 403);
    }

    if (user.provider === "google") {
      throw new AppError("Use Google login for this account", 401);
    }

    const ok = await user.comparePassword(String(credentials.password || ""));
    if (!ok) throw new AppError("Invalid email or password", 401);

    (user as any).lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: sanitizeUserForResponse(user), token };
  },

  loginWithGoogle: async (payload: {
    email: string;
    name: string;
    providerId: string;
    avatar?: string;
  }) => {
    const email = String(payload.email || "").trim().toLowerCase();
    const name = String(payload.name || "").trim();

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user && (user as any).isDeleted) {
      throw new AppError(
        "This account has been deleted. Please register again.",
        403
      );
    }

    if (user && (user as any).isBlocked) {
      throw new AppError("Your account has been blocked by admin.", 403);
    }

    if (user && user.provider !== "google") {
      throw new AppError(
        "This email is already registered with email/password login.",
        409
      );
    }

    if (!user) {
      isNewUser = true;
      user = new User({
        email,
        name,
        provider: "google",
        providerId: payload.providerId,
        avatar: payload.avatar,
        role: "customer",
        isBlocked: false,
        blockedAt: null,
        isDeleted: false,
        deletedAt: null,
      });
    }

    (user as any).lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: sanitizeUserForResponse(user), token, isNewUser };
  },

  logoutUser: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return { message: "Logged out successfully" };
  },

  getUserById: async (userId: string) => {
    if (!userId) return null;
    const user = await User.findById(userId);
    if (!user) return null;
    return sanitizeUserForResponse(user);
  },

  updateProfile: async (
    userId: string,
    data: {
      name?: string;
      address?: string;
      height?: number | string;
      weight?: number | string;
    }
  ) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("Your account has been blocked by admin.", 403);
    }

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
    return sanitizeUserForResponse(user);
  },

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

    const superAdmin = new User({
      email,
      name,
      password: userData.password,
      role: "superadmin",
      provider: "credentials",
      status: "active",
      mustChangePassword: false,
      permissions: fullSuperadminPermissions(),
      isBlocked: false,
      blockedAt: null,
      isDeleted: false,
      deletedAt: null,
      lastLogin: new Date(),
    });

    await superAdmin.save();

    const token = generateToken({
      userId: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
    });

    return { user: sanitizeUserForResponse(superAdmin), token };
  },

  adminLogin: async (credentials: LoginDto) => {
    const email = String(credentials.email || "").trim().toLowerCase();

    const user = await User.findOne({
      email,
      role: { $in: ["admin", "superadmin"] },
      provider: "credentials",
    }).select("+password");

    if (!user) throw new AppError("Invalid email or password", 401);

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("This admin account has been blocked.", 403);
    }

    if ((user as any).status === "inactive") {
      throw new AppError("This admin account is inactive.", 403);
    }

    const ok = await user.comparePassword(String(credentials.password || ""));
    if (!ok) throw new AppError("Invalid email or password", 401);

    (user as any).lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: sanitizeUserForResponse(user), token };
  },
};