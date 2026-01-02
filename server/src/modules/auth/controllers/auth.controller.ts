// server/src/modules/auth/controllers/auth.controller.ts
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

// ✅ Cookie names
const CUSTOMER_COOKIE = process.env.COOKIE_NAME || "token";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "adminToken";

/**
 * ✅ Cookie settings that work:
 * - Localhost dev (http): secure=false, sameSite="lax"
 * - Production cross-domain (https): secure=true, sameSite="none"
 */
function getCookieOptions() {
  const isProd = config.nodeEnv === "production";

  const sameSiteEnv = (process.env.COOKIE_SAMESITE || "").toLowerCase();
  const secureEnv = (process.env.COOKIE_SECURE || "").toLowerCase();

  const sameSite =
    sameSiteEnv === "none" || sameSiteEnv === "lax" || sameSiteEnv === "strict"
      ? (sameSiteEnv as "none" | "lax" | "strict")
      : isProd
      ? "none"
      : "lax";

  // sameSite="none" MUST have secure=true in modern browsers
  const secure =
    secureEnv === "true"
      ? true
      : secureEnv === "false"
      ? false
      : sameSite === "none"
      ? true
      : isProd;

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/", // ✅ important for /api/orders and /api/admin/*
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

function setCookie(res: Response, cookieName: string, token: string) {
  res.cookie(cookieName, token, getCookieOptions());
}

function clearCookie(res: Response, cookieName: string) {
  res.clearCookie(cookieName, {
    ...getCookieOptions(),
    maxAge: undefined,
  });
}

export const authController = {
  // ---------- Register user ----------
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: RegisterDto = req.body;

      if (!userData.email || !userData.password || !userData.name) {
        throw new AppError("Email, password, and name are required", 400);
      }

      const result = await authService.registerUser(userData);

      // ✅ CUSTOMER cookie
      setCookie(res, CUSTOMER_COOKIE, result.token);

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

      // ✅ CUSTOMER cookie
      setCookie(res, CUSTOMER_COOKIE, result.token);

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

      // ✅ case-insensitive role check
      const role = String(result.user.role || "").toLowerCase();
      if (role !== "admin" && role !== "superadmin") {
        throw new AppError("Access denied. Admin only.", 403);
      }

      // ✅ ADMIN cookie (separate from customer)
      setCookie(res, ADMIN_COOKIE, result.token);

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

      // ✅ clear BOTH cookies
      clearCookie(res, CUSTOMER_COOKIE);
      clearCookie(res, ADMIN_COOKIE);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Get current user (CUSTOMER SESSION) ----------
  getMe: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = await authService.getUserById(userId);

      if (!user) {
        clearCookie(res, CUSTOMER_COOKIE);

        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Init superadmin ----------
  initSuperAdmin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError("Email, password, and name are required", 400);
      }

      const result = await authService.initializeSuperAdmin({ email, password, name });

      // ✅ ADMIN cookie
      setCookie(res, ADMIN_COOKIE, result.token);

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

  // ---------- Google OAuth redirect callback ----------
  googleCallback: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const profile = req.user as Profile;

      const email = profile.emails?.[0]?.value;
      const name =
        profile.displayName ||
        `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();
      const providerId = profile.id;
      const avatar = profile.photos?.[0]?.value;

      if (!email || !name || !providerId) {
        throw new AppError("Invalid Google profile data", 400);
      }

      const result = await authService.loginWithGoogle({ email, name, providerId, avatar });

      // ✅ CUSTOMER cookie
      setCookie(res, CUSTOMER_COOKIE, result.token);

      const base = process.env.CLIENT_BASE_URL || "http://localhost:3000";
      return res.redirect(`${base}/homepage`);
    } catch (error) {
      next(error);
    }
  },

  // ---------- Google login via POST ----------
  googleLogin: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, providerId, avatar } = req.body;

      if (!email || !name || !providerId) {
        throw new AppError("Invalid Google user data", 400);
      }

      const result = await authService.loginWithGoogle({ email, name, providerId, avatar });

      // ✅ CUSTOMER cookie
      setCookie(res, CUSTOMER_COOKIE, result.token);

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
