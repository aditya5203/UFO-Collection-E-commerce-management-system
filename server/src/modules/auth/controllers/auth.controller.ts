import { Request, Response, NextFunction } from "express";
import type { Profile } from "passport-google-oauth20";
import crypto from "crypto";

import { authService } from "../services/auth.service";
import { RegisterDto, LoginDto } from "../types/auth.types";
import { AppError } from "../../../middleware/error.middleware";
import { clientBaseUrl, getCookieOptions } from "../../../config/runtime";
import { User } from "../../../models/User.model";
import { emailService } from "../../../services/email.services";
import { notificationService } from "../../notifications/services/notification.service";

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

const CUSTOMER_COOKIE = process.env.COOKIE_NAME || "token";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "adminToken";
const DELIVERY_COOKIE = process.env.DELIVERY_COOKIE_NAME || "deliveryToken";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const NEPALI_PHONE_REGEX = /^(97|98)\d{8}$/;

function validateStrongPassword(password: string) {
  const clean = String(password || "").trim();

  if (!clean) {
    throw new AppError("Password is required", 400);
  }

  if (!STRONG_PASSWORD_REGEX.test(clean)) {
    throw new AppError(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol",
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

function makeDeletedEmail(oldEmail: string, userId: string) {
  const safe = (oldEmail || "user").replace(/[^a-zA-Z0-9]/g, "");
  return `deleted_${safe}_${userId}@deleted.local`;
}

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

function sendWelcomeEmailAsync(email: string, name: string) {
  emailService
    .sendMail({
      to: email,
      subject: "Welcome to UFO Collection",
      html: buildWelcomeEmailHtml(name),
    })
    .then(() => console.log("✅ Welcome email sent to:", email))
    .catch((err: any) =>
      console.error("❌ Welcome email failed:", err?.message || err)
    );
}

export const authController = {
  register: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userData = req.body as RegisterDto & { phone?: string };

      if (!userData.email || !userData.password || !userData.name) {
        throw new AppError("Email, password, and name are required", 400);
      }

      if (!userData.phone) {
        throw new AppError("Phone number is required", 400);
      }

      validateNepaliPhone(userData.phone);
      validateStrongPassword(userData.password);

      const result = await authService.registerUser(userData);

      setCookie(res, CUSTOMER_COOKIE, result.token);

      try {
        await notificationService.createAdminForAll({
          title: "New user registered",
          message: `${
            result.user.name || result.user.email || "A new user"
          } joined the platform.`,
          type: "user",
          link: "/admin/customers",
          meta: {
            userId: String(result.user._id),
            name: result.user.name || "",
            email: result.user.email || "",
            phone: result.user.phone || "",
            provider: result.user.provider || "credentials",
          },
        });
      } catch (err: any) {
        console.log("Register notification failed (ignored):", err?.message);
      }

      sendWelcomeEmailAsync(result.user.email, result.user.name);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: result.token,
        user: result.user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  login: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const credentials: LoginDto = req.body;

      if (!credentials.email || !credentials.password) {
        throw new AppError("Email and password are required", 400);
      }

      const result = await authService.loginUser(credentials);

      setCookie(res, CUSTOMER_COOKIE, result.token);

      res.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  deliveryLogin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const credentials = req.body;

      if (
        (!credentials.email &&
          !credentials.phone &&
          !credentials.emailOrPhone) ||
        !credentials.password
      ) {
        throw new AppError("Email or phone and password are required", 400);
      }

      const result = await authService.deliveryLogin(credentials);

      setCookie(res, DELIVERY_COOKIE, result.token);

      res.status(200).json({
        success: true,
        message: "Delivery login successful",
        token: result.token,
        mustChangePassword: !!result.user.mustChangePassword,
        user: {
          _id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status,
          mustChangePassword: result.user.mustChangePassword,
          phone: result.user.phone,
          vehicleType: result.user.vehicleType,
          vehicleNumber: result.user.vehicleNumber,
          deliveryArea: result.user.deliveryArea,
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  deliveryMe: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = await authService.getDeliveryMe(userId);

      if (!user) {
        clearCookie(res, DELIVERY_COOKIE);
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  deliveryChangePassword: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };

      const user = await authService.deliveryChangePassword(
        userId,
        String(currentPassword || ""),
        String(newPassword || "")
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  changePassword: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };

      const user = await authService.changePassword(
        userId,
        String(currentPassword || ""),
        String(newPassword || "")
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
        user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  forgotPassword: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) throw new AppError("Email is required", 400);

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        res.status(200).json({
          success: true,
          message: "If your email exists, we sent a password reset link.",
        });
        return;
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = sha256(rawToken);

      (user as any).resetPasswordTokenHash = tokenHash;
      (user as any).resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      const role = String((user as any).role || "").toLowerCase();
      const resetLink = `${clientBaseUrl}/reset-password?token=${rawToken}&role=${role}`;

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

      res.status(200).json({
        success: true,
        message: "If your email exists, we sent a password reset link.",
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  resetPassword: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, password } = req.body as {
        token?: string;
        password?: string;
      };

      if (!token || !password) {
        throw new AppError("Token and password are required", 400);
      }

      const cleanPassword = validateStrongPassword(password);
      const tokenHash = sha256(token);

      const user = await User.findOne({
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
      }).select("+password");

      if (!user) throw new AppError("Invalid or expired reset token", 400);

      (user as any).password = cleanPassword;
      (user as any).provider = "credentials";
      (user as any).resetPasswordTokenHash = null;
      (user as any).resetPasswordExpires = null;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password reset successful. Please login.",
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  acceptInvite: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, password } = req.body as {
        token?: string;
        password?: string;
      };

      const result = await authService.acceptInvite(
        String(token || ""),
        String(password || "")
      );

      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  adminLogin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const credentials: LoginDto = req.body;

      if (!credentials.email || !credentials.password) {
        throw new AppError("Email and password are required", 400);
      }

      const result = await authService.adminLogin(credentials);

      const role = String(result.user.role || "").toLowerCase();
      if (role !== "admin" && role !== "superadmin") {
        throw new AppError("Access denied. Admin only.", 403);
      }

      setCookie(res, ADMIN_COOKIE, result.token);

      res.status(200).json({
        success: true,
        message: "Admin login successful",
        token: result.token,
        user: {
          _id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status,
          mustChangePassword: result.user.mustChangePassword,
          permissions: result.user.permissions || {},
          avatar: result.user.avatar,
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  logout: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      await authService.logoutUser(userId);

      clearCookie(res, CUSTOMER_COOKIE);

      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  adminLogout: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      await authService.logoutUser(userId);

      clearCookie(res, ADMIN_COOKIE);

      res.status(200).json({
        success: true,
        message: "Admin logout successful",
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  deliveryLogout: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      await authService.logoutUser(userId);

      clearCookie(res, DELIVERY_COOKIE);

      res.status(200).json({
        success: true,
        message: "Delivery logout successful",
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  getMe: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  initSuperAdmin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

      setCookie(res, ADMIN_COOKIE, result.token);

      res.status(201).json({
        success: true,
        message: "Superadmin initialized successfully",
        token: result.token,
        user: result.user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  updateProfile: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      const { name, height, weight, address, phone } = req.body;

      const updatedUser = await authService.updateProfile(userId, {
        name,
        phone,
        height,
        weight,
        address,
      });

      res.status(200).json({
        success: true,
        user: updatedUser,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  deleteMyAccount: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as any)?.userId;
      if (!userId) throw new AppError("User not authenticated", 401);

      const user = await User.findById(userId);
      if (!user) {
        clearCookie(res, CUSTOMER_COOKIE);
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      const role = String((user as any).role || "").toLowerCase();
      if (role === "admin" || role === "superadmin" || role === "delivery") {
        throw new AppError(
          "This account cannot be deleted from customer portal.",
          403
        );
      }

      const oldEmail = user.email;

      await User.updateOne(
        { _id: userId },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            email: makeDeletedEmail(oldEmail, String(user._id)),
            name: "Deleted User",
            providerId: undefined,
            avatar: undefined,
            resetPasswordTokenHash: null,
            resetPasswordExpires: null,
          },
        }
      );

      clearCookie(res, CUSTOMER_COOKIE);

      res.status(200).json({
        success: true,
        message: "Account deleted successfully",
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  googleCallback: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

      setCookie(res, CUSTOMER_COOKIE, result.token);

      if (result.isNewUser) {
        try {
          await notificationService.createAdminForAll({
            title: "New user registered",
            message: `${
              result.user.name || result.user.email || "A new user"
            } joined the platform with Google.`,
            type: "user",
            link: "/admin/customers",
            meta: {
              userId: String(result.user._id),
              name: result.user.name || "",
              email: result.user.email || "",
              provider: "google",
            },
          });
        } catch (err: any) {
          console.log(
            "Google register notification failed (ignored):",
            err?.message
          );
        }

        sendWelcomeEmailAsync(result.user.email, result.user.name);
      }

      res.redirect(`${clientBaseUrl}/homepage`);
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  googleLogin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

      setCookie(res, CUSTOMER_COOKIE, result.token);

      if (result.isNewUser) {
        try {
          await notificationService.createAdminForAll({
            title: "New user registered",
            message: `${
              result.user.name || result.user.email || "A new user"
            } joined the platform with Google.`,
            type: "user",
            link: "/admin/customers",
            meta: {
              userId: String(result.user._id),
              name: result.user.name || "",
              email: result.user.email || "",
              provider: "google",
            },
          });
        } catch (err: any) {
          console.log(
            "Google login register notification failed (ignored):",
            err?.message
          );
        }

        sendWelcomeEmailAsync(result.user.email, result.user.name);
      }

      res.status(200).json({
        success: true,
        message: "Login with Google successful",
        token: result.token,
        user: result.user,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
};
