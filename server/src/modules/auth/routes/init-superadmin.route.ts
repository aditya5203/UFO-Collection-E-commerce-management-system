// server/src/modules/auth/routes/init-superadmin.route.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { User } from "../../../models/User.model";
import { config } from "../../../config";
import { AppError } from "../../../middleware/error.middleware";

const router = Router();

// ✅ Cookie names (must match your system)
const CUSTOMER_COOKIE = process.env.COOKIE_NAME || "token";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "adminToken";

function setCookie(res: any, cookieName: string, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/", // ✅ important for /api/admin/*
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearCookie(res: any, cookieName: string) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Create FIRST superadmin in the system.
 * Can only be executed when NO superadmin exists.
 */
router.post("/", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError("Email, password, and name are required", 400);
    }

    // Check if any superadmin already exists
    const superAdminExists = await User.findOne({ role: "superadmin" });
    if (superAdminExists) {
      return res.status(409).json({
        success: false,
        message: "Superadmin already exists",
      });
    }

    // Check if this email is already used by any user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create superadmin user
    const admin = await User.create({
      email: email.toLowerCase(),
      name,
      password: hashed,
      role: "superadmin",
      provider: "credentials",
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    // ✅ IMPORTANT:
    // clear customer cookie if it exists (avoid mixing sessions)
    clearCookie(res, CUSTOMER_COOKIE);

    // ✅ set ADMIN cookie so admin routes work
    setCookie(res, ADMIN_COOKIE, token);

    return res.status(201).json({
      success: true,
      message: "Superadmin initialized successfully",
      token,
      user: admin.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
