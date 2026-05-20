import { User } from "../../../models";
import { RegisterDto, LoginDto, JwtPayload } from "../types/auth.types";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { AppError } from "../../../middleware/error.middleware";
import { fullSuperadminPermissions } from "../../../models/User.model";
import { hashInviteToken } from "../../../services/invite.service";

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const NEPALI_PHONE_REGEX = /^(97|98)\d{8}$/;

function validateStrongPassword(password: string, label = "Password") {
  const clean = String(password || "").trim();

  if (!clean) {
    throw new AppError(`${label} is required`, 400);
  }

  if (!STRONG_PASSWORD_REGEX.test(clean)) {
    throw new AppError(
      `${label} must be at least 8 characters and include uppercase, lowercase, number, and symbol`,
      400
    );
  }

  return clean;
}

function validateNepaliPhone(phone: string) {
  const clean = String(phone || "").trim();

  if (!clean) {
    throw new AppError("Phone number is required", 400);
  }

  if (!NEPALI_PHONE_REGEX.test(clean)) {
    throw new AppError("Please enter a valid Nepali mobile number", 400);
  }

  return clean;
}

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
    phone: plain.phone,
    vehicleType: plain.vehicleType,
    vehicleNumber: plain.vehicleNumber,
    deliveryArea: plain.deliveryArea,
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
  registerUser: async (userData: RegisterDto & { phone?: string }) => {
    const email = String(userData.email || "").trim().toLowerCase();
    const name = String(userData.name || "").trim();
    const phone = validateNepaliPhone(userData.phone || "");
    const password = validateStrongPassword(userData.password, "Password");

    if (!email || !name || !password || !phone) {
      throw new AppError("Email, password, name, and phone are required", 400);
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError("User with this email already exists", 409);
      }

      throw new AppError("User with this mobile number already exists", 409);
    }

    const heightFt =
      userData.height !== undefined && userData.height !== null
        ? Number(userData.height)
        : undefined;

    const weightKg =
      userData.weight !== undefined && userData.weight !== null
        ? Number(userData.weight)
        : undefined;

    if (heightFt !== undefined && (!Number.isFinite(heightFt) || heightFt <= 0 || heightFt > 8)) {
      throw new AppError("Please enter a valid height in feet", 400);
    }

    if (weightKg !== undefined && (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 250)) {
      throw new AppError("Please enter a valid weight in kg", 400);
    }

    const { men, women } = getRecommendedSizes(heightFt, weightKg);

    const user = new User({
      email,
      name,
      phone,
      password,
      address: userData.address,
      role: "customer",
      provider: "credentials",
      height: heightFt,
      weight: weightKg,
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

    if (String(user.role || "").toLowerCase() !== "customer") {
      throw new AppError("Customer login only", 403);
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

  if (!user) {
    isNewUser = true;

    user = new User({
      email,
      name,
      provider: "google",
      providerId: payload.providerId,
      avatar: payload.avatar,
      role: "customer",
      status: "active",
      isBlocked: false,
      blockedAt: null,
      isDeleted: false,
      deletedAt: null,
      lastLogin: new Date(),
    });
  } else {
    if (String(user.role || "").toLowerCase() !== "customer") {
      throw new AppError(
        "Google login is only available for customer accounts.",
        403
      );
    }

    if (user.providerId && user.providerId !== payload.providerId) {
      throw new AppError(
        "This email is already linked with another Google account.",
        409
      );
    }

    // Link existing email/password customer account with Google
    if (!user.providerId) {
      (user as any).providerId = payload.providerId;
    }

    // Keep existing provider as credentials so password login still works
    // but Google login also works through providerId.
    if (!user.avatar && payload.avatar) {
      user.avatar = payload.avatar;
    }

    (user as any).lastLogin = new Date();
  }

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
      phone?: string;
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

    if (String(user.role || "").toLowerCase() !== "customer") {
      throw new AppError("Customer profile only", 403);
    }

    if (data.name !== undefined) user.name = String(data.name).trim();
    if (data.address !== undefined) user.address = String(data.address).trim();

    if (data.phone !== undefined) {
      const cleanPhone = validateNepaliPhone(String(data.phone));

      const existingPhone = await User.findOne({
        phone: cleanPhone,
        _id: { $ne: user._id },
      });

      if (existingPhone) {
        throw new AppError("User with this mobile number already exists", 409);
      }

      (user as any).phone = cleanPhone;
    }

    if (data.height !== undefined && data.height !== null) {
      const h = Number(data.height);

      if (!Number.isFinite(h) || h <= 0 || h > 8) {
        throw new AppError("Please enter a valid height in feet", 400);
      }

      user.height = h;
    }

    if (data.weight !== undefined && data.weight !== null) {
      const w = Number(data.weight);

      if (!Number.isFinite(w) || w <= 0 || w > 250) {
        throw new AppError("Please enter a valid weight in kg", 400);
      }

      user.weight = w;
    }

    const { men, women } = getRecommendedSizes(user.height, user.weight);
    if (men) user.recommendedSizeMen = men;
    if (women) user.recommendedSizeWomen = women;

    await user.save();
    return sanitizeUserForResponse(user);
  },

  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new AppError("User not found", 404);

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("Your account has been blocked by admin.", 403);
    }

    if (String(user.role || "").toLowerCase() !== "customer") {
      throw new AppError("Customer access only", 403);
    }

    if (user.provider === "google") {
      throw new AppError(
        "This account uses Google login. Password change is not available.",
        400
      );
    }

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    const cleanNewPassword = validateStrongPassword(
      newPassword,
      "New password"
    );

    const ok = await user.comparePassword(String(currentPassword || ""));
    if (!ok) throw new AppError("Current password is incorrect", 400);

    const sameAsOld = await user.comparePassword(cleanNewPassword);
    if (sameAsOld) {
      throw new AppError(
        "New password must be different from current password",
        400
      );
    }

    (user as any).password = cleanNewPassword;
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
    const password = validateStrongPassword(userData.password, "Password");

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    const superAdmin = new User({
      email,
      name,
      password,
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

    if ((user as any).status === "invited") {
      throw new AppError("Please accept your email invitation first.", 403);
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

  deliveryLogin: async (credentials: any) => {
    const email = String(credentials.email || "").trim().toLowerCase();
    const phone = String(credentials.phone || "").trim();
    const emailOrPhone = String(credentials.emailOrPhone || "").trim();

    const password = String(credentials.password || "");
    if (!password) throw new AppError("Password is required", 400);

    const query: any = {
      role: "delivery",
      provider: "credentials",
    };

    if (emailOrPhone) {
      query.$or = [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone },
      ];
    } else if (email) {
      query.email = email;
    } else if (phone) {
      query.phone = phone;
    } else {
      throw new AppError("Email or phone is required", 400);
    }

    const user = await User.findOne(query).select("+password");

    if (!user) throw new AppError("Invalid email/phone or password", 401);

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("This delivery account has been blocked.", 403);
    }

    if ((user as any).status === "invited") {
      throw new AppError("Please accept your email invitation first.", 403);
    }

    if ((user as any).status === "inactive") {
      throw new AppError("This delivery account is inactive.", 403);
    }

    const ok = await user.comparePassword(password);
    if (!ok) throw new AppError("Invalid email/phone or password", 401);

    (user as any).lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user: sanitizeUserForResponse(user), token };
  },

  deliveryChangePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new AppError("User not found", 404);

    if (String(user.role || "").toLowerCase() !== "delivery") {
      throw new AppError("Delivery access only", 403);
    }

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("This delivery account has been blocked.", 403);
    }

    if ((user as any).status === "inactive") {
      throw new AppError("This delivery account is inactive.", 403);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    const cleanNewPassword = validateStrongPassword(
      newPassword,
      "New password"
    );

    const ok = await user.comparePassword(String(currentPassword || ""));
    if (!ok) throw new AppError("Current password is incorrect", 400);

    const sameAsOld = await user.comparePassword(cleanNewPassword);
    if (sameAsOld) {
      throw new AppError(
        "New password must be different from current password",
        400
      );
    }

    (user as any).password = cleanNewPassword;
    (user as any).mustChangePassword = false;
    await user.save();

    return sanitizeUserForResponse(user);
  },

  getDeliveryMe: async (userId: string) => {
    if (!userId) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    if (String(user.role || "").toLowerCase() !== "delivery") {
      throw new AppError("Delivery access only", 403);
    }

    if ((user as any).isDeleted) {
      throw new AppError("This account has been deleted.", 403);
    }

    if ((user as any).isBlocked) {
      throw new AppError("This delivery account has been blocked.", 403);
    }

    return sanitizeUserForResponse(user);
  },

  acceptInvite: async (token: string, password: string) => {
    if (!token) {
      throw new AppError("Invite token is required", 400);
    }

    const cleanPassword = validateStrongPassword(password);

    const tokenHash = hashInviteToken(String(token).trim());

    const user = await User.findOne({
      inviteTokenHash: tokenHash,
      inviteTokenExpires: { $gt: new Date() },
      status: "invited",
      role: { $in: ["admin", "delivery"] },
    }).select("+password");

    if (!user) {
      throw new AppError("Invalid or expired invitation link", 400);
    }

    (user as any).password = cleanPassword;
    (user as any).provider = "credentials";
    (user as any).status = "active";
    (user as any).mustChangePassword = false;
    (user as any).inviteAcceptedAt = new Date();
    (user as any).inviteTokenHash = null;
    (user as any).inviteTokenExpires = null;

    await user.save();

    return {
      message: "Invitation accepted successfully. You can now log in.",
      user: sanitizeUserForResponse(user),
    };
  },
};