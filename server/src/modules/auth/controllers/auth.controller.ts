// server/src/modules/auth/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import type { Profile } from "passport-google-oauth20";
import crypto from "crypto";

import { authService } from "../services/auth.service";
import { RegisterDto, LoginDto } from "../types/auth.types";
import { AppError } from "../../../middleware/error.middleware";
import { config } from "../../../config";
import { User } from "../../../models/User.model";
import { emailService } from "../../../services/email.services";

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

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** ✅ Welcome email template (Option 4) */
function buildWelcomeEmailHtml(name: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2>Welcome to UFO Collection</h2>

      <p>Dear <strong>${name || "Customer"}</strong>,</p>

      <p>
        We’re delighted to welcome you to <strong>UFO Collection</strong>.
      </p>

      <p>
        Your account has been successfully created, and you can now explore our full
        range of products, curated collections, and exclusive features designed to
        enhance your shopping experience.
      </p>

      <p>
        If you need any assistance, our support team is always here to help.
      </p>

      <p>
        Thank you for choosing UFO Collection.
      </p>

      <p style="margin-top: 20px;">
        Kind regards,<br />
        <strong>UFO Collection Team</strong>
      </p>

      <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;" />

      <p style="font-size: 12px; color: #666;">
        © 2025 UFO Collection. All rights reserved.
      </p>
    </div>
  `;
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

      // ✅ Send Welcome Email (non-blocking)
      // If email fails, registration still succeeds
      emailService
        .sendMail({
          to: result.user.email,
          subject: "Welcome to UFO Collection",
          html: buildWelcomeEmailHtml(result.user.name),
        })
        .then(() => console.log("✅ Welcome email sent to:", result.user.email))
        .catch((err: any) =>
          console.error("❌ Welcome email failed:", err?.message || err)
        );

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

  // ---------- Forgot Password ----------
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) throw new AppError("Email is required", 400);

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      // ✅ Always return success to avoid user enumeration
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If your email exists, we sent a password reset link.",
        });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = sha256(rawToken);

      // NOTE: your User model must have these fields:
      // resetPasswordTokenHash, resetPasswordExpires
      (user as any).resetPasswordTokenHash = tokenHash;
      (user as any).resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      const clientBase = process.env.CLIENT_BASE_URL || "http://localhost:3000";
      const resetLink = `${clientBase}/reset-password?token=${rawToken}`;

      await emailService.sendMail({
        to: user.email,
        subject: "Reset your UFO Collection password",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Reset Password</h2>
            <p>We received a request to reset your password.</p>
            <p>
              <a href="${resetLink}"
                 style="display:inline-block;padding:10px 16px;background:#b49cff;color:#070818;text-decoration:none;border-radius:999px">
                Reset Password
              </a>
            </p>
            <p>This link expires in 15 minutes.</p>
            <p>If you didn’t request this, you can ignore this email.</p>
          </div>
        `,
      });

      return res.status(200).json({
        success: true,
        message: "If your email exists, we sent a password reset link.",
      });
    } catch (error) {
      next(error);
    }
  },

  // ---------- Reset Password ----------
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body as { token?: string; password?: string };

      if (!token || !password) throw new AppError("Token and password are required", 400);
      if (password.length < 6)
        throw new AppError("Password must be at least 6 characters", 400);

      const tokenHash = sha256(token);

      const user = await User.findOne({
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
      }).select("+password");

      if (!user) throw new AppError("Invalid or expired reset token", 400);

      // ✅ set new password (hashed by pre-save hook)
      (user as any).password = password;
      (user as any).provider = "credentials"; // allow google users to set password too
      (user as any).resetPasswordTokenHash = null;
      (user as any).resetPasswordExpires = null;

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Password reset successful. Please login.",
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
