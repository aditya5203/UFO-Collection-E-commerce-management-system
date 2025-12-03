import { User } from '../../../models';
import { RegisterDto, LoginDto, JwtPayload } from '../types/auth.types';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../../../config';
import { AppError } from '../../../middleware/error.middleware';

// ---------------- JWT Helper ----------------

const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
};

// ---------------- Size Recommendation Helper ----------------

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
type Size = (typeof SIZES)[number];

const getRecommendedSizes = (
  heightFt?: number,
  weightKg?: number
): { men?: Size; women?: Size } => {
  if (!heightFt) return {};

  let men: Size;
  if (heightFt < 5.2) men = 'S';
  else if (heightFt < 5.6) men = 'M';
  else if (heightFt < 5.9) men = 'L';
  else if (heightFt < 6.1) men = 'XL';
  else men = 'XXL';

  let women: Size;
  if (heightFt < 4.11) women = 'XS';
  else if (heightFt < 5.2) women = 'S';
  else if (heightFt < 5.5) women = 'M';
  else if (heightFt < 5.8) women = 'L';
  else women = 'XL';

  return { men, women };
};

// ---------------- Auth Service ----------------

export const authService = {
  // ---------- Register new user (email/password) ----------
  registerUser: async (userData: RegisterDto) => {
    const existingUser = await User.findOne({
      email: userData.email.toLowerCase(),
    });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
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
      isNaN(heightFt as number) ? undefined : heightFt,
      isNaN(weightKg as number) ? undefined : weightKg
    );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = new User({
      email: userData.email.toLowerCase(),
      name: userData.name,
      password: hashedPassword,
      address: userData.address,
      role: 'customer',
      provider: 'credentials', // 👈 mark as normal account

      height: !isNaN(heightFt as number) ? heightFt : undefined,
      weight: !isNaN(weightKg as number) ? weightKg : undefined,
      recommendedSizeMen: men,
      recommendedSizeWomen: women,
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userObject = user.toJSON();

    return {
      user: userObject,
      token,
    };
  },

  // ---------- Login user (email/password) ----------
  loginUser: async (credentials: LoginDto) => {
    const user = await User.findOne({
      email: credentials.email.toLowerCase(),
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userObject = user.toJSON();

    return {
      user: userObject,
      token,
    };
  },

  // 🔹 ---------- Login / Signup with Google ----------
  loginWithGoogle: async (payload: {
    email: string;
    name: string;
    providerId: string;
    avatar?: string;
  }) => {
    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });

    // if email already used for normal account, block Google login
    if (user && user.provider !== 'google') {
      throw new AppError(
        'This email is already registered with email/password login.',
        409
      );
    }

    if (!user) {
      user = new User({
        email,
        name: payload.name,
        provider: 'google',
        providerId: payload.providerId,
        avatar: payload.avatar,
        role: 'customer',
      });

      await user.save();
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userObject = user.toJSON();

    return {
      user: userObject,
      token,
    };
  },

  // ---------- Logout user ----------
  logoutUser: async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return { message: 'Logged out successfully' };
  },

  // ---------- Get current user ----------
  // ---------- Get current user ----------
getUserById: async (userId: string) => {
  if (!userId) return null;

  const user = await User.findById(userId);

  // If user doesn't exist (deleted / invalid token), just return null
  if (!user) {
    return null;
  }

  return user.toJSON();
},


  // ---------- Update profile ----------
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
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.address !== undefined) user.address = data.address;

    if (data.height !== undefined && data.height !== null) {
      const parsedHeight = Number(data.height);
      user.height = isNaN(parsedHeight) ? undefined : parsedHeight;
    }

    if (data.weight !== undefined && data.weight !== null) {
      const parsedWeight = Number(data.weight);
      user.weight = isNaN(parsedWeight) ? undefined : parsedWeight;
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
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      throw new AppError('Superadmin already exists', 409);
    }

    const existingUser = await User.findOne({
      email: userData.email.toLowerCase(),
    });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const superAdmin = new User({
      email: userData.email.toLowerCase(),
      name: userData.name,
      password: hashedPassword,
      role: 'superadmin',
      provider: 'credentials',
    });

    await superAdmin.save();

    const token = generateToken({
      userId: superAdmin._id.toString(),
      email: superAdmin.email,
      role: superAdmin.role,
    });

    const userObject = superAdmin.toJSON();

    return {
      user: userObject,
      token,
    };
  },

  // ---------- Admin / Superadmin login (for admin panel) ----------
  adminLogin: async (credentials: LoginDto) => {
    const user = await User.findOne({
      email: credentials.email.toLowerCase(),
      role: { $in: ['admin', 'superadmin'] },
      provider: 'credentials',
    }).select('+password');

    if (!user) {
      // Either not found, or role is not admin/superadmin
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(credentials.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const userObject = user.toJSON();

    return {
      user: userObject,
      token,
    };
  },
};
