// src/modules/auth/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import type { Profile } from "passport-google-oauth20";
import { authService } from "../services/auth.service";
import { RegisterDto, LoginDto } from "../types/auth.types";
import { AppError } from "../../../middleware/error.middleware";
import { config } from "../../../config";

// Local type for requests where we use req.user
type AuthRequest = Request & {
  user?:
    | {
        userId?: string;
        email?: string;
        role?: string;
        [key: string]: any;
      }
    | Profile;
};

export const authController = {
  // ---------- Register user ----------
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: RegisterDto = req.body;

      if (!userData.email || !userData.password || !userData.name) {
        throw new AppError("Email, password, and name are required", 400);
      }

      const result = await authService.registerUser(userData);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Normal user login ----------
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: LoginDto = req.body;

      if (!credentials.email || !credentials.password) {
        throw new AppError("Email and password are required", 400);
      }

      const result = await authService.loginUser(credentials);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- ADMIN LOGIN ----------
  adminLogin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const credentials: LoginDto = req.body;

      if (!credentials.email || !credentials.password) {
        throw new AppError("Email and password are required", 400);
      }

      const result = await authService.loginUser(credentials);

      if (result.user.role !== "admin" && result.user.role !== "superadmin") {
        throw new AppError("Access denied. Admin only.", 403);
      }

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Admin login successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Logout ----------
  logout: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      await authService.logoutUser(userId);

      res.clearCookie("token", {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
      });

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Get current user ----------
  // ---------- Get current user ----------
getMe: async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req.user as any)?.userId;

    // No decoded user in request → not authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return; // ✅ important so TS sees we return here
    }

    const user = await authService.getUserById(userId);

    // Token exists but user no longer exists in DB
    if (!user) {
      // Optional: clear bad cookie
      res.clearCookie("token", {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
      });

      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return; // ✅
    }

    res.status(200).json({
      success: true,
      user,
    });
    return; // ✅
  } catch (error) {
    next(error);
    return; // ✅ for TS
  }
},


  // ---------- Init superadmin ----------
  initSuperAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError("Email, password, and name are required", 400);
      }

      const result = await authService.initializeSuperAdmin({
        email,
        password,
        name,
      });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: "Superadmin initialized successfully",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Update profile ----------
  updateProfile: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      const { name, height, weight, address } = req.body;

      const updatedUser = await authService.updateProfile(userId, {
        name,
        height,
        weight,
        address,
      });

      res.status(200).json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Google OAuth redirect callback (GET /api/auth/google/callback) ----------
  googleCallback: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const profile = req.user as Profile;

      const email = profile.emails?.[0]?.value;
      const name =
        profile.displayName ||
        `${profile.name?.givenName || ""} ${
          profile.name?.familyName || ""
        }`.trim();
      const providerId = profile.id;
      const avatar = profile.photos?.[0]?.value;

      if (!email || !name || !providerId) {
        throw new AppError("Invalid Google profile data", 400);
      }

      const result = await authService.loginWithGoogle({
        email,
        name,
        providerId,
        avatar,
      });

      // ✅ Set token cookie
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const base = process.env.CLIENT_BASE_URL || "http://localhost:3000";

      // 🔥 IMPORTANT:
      // Redirect to HOMEPAGE after Google signup/login
      // If your homepage is "/", use `${base}/`
      // If your homepage page is "/homepage", use `${base}/homepage`
      return res.redirect(`${base}/homepage`);
    } catch (error) {
      next(error);
    }
  },

  // ---------- Google login via POST (if you use it from frontend) ----------
  googleLogin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, providerId, avatar } = req.body;

      if (!email || !name || !providerId) {
        throw new AppError("Invalid Google user data", 400);
      }

      const result = await authService.loginWithGoogle({
        email,
        name,
        providerId,
        avatar,
      });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login with Google successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },
};
