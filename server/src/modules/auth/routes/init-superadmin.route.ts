// server/src/modules/auth/routes/init-superadmin.route.ts
import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { User } from "../../../models/User.model";
import { config } from "../../../config";
import { AppError } from "../../../middleware/error.middleware";

const router = Router();

const CUSTOMER_COOKIE = process.env.COOKIE_NAME || "token";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "adminToken";

function setCookie(res: Response, cookieName: string, token: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearCookie(res: Response, cookieName: string) {
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
router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError("Email, password, and name are required", 400);
      }

      const superAdminExists = await User.findOne({ role: "superadmin" });
      if (superAdminExists) {
        res.status(409).json({
          success: false,
          message: "Superadmin already exists",
        });
        return;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      const hashed = await bcrypt.hash(password, 10);

      const admin = await User.create({
        email: email.toLowerCase(),
        name,
        password: hashed,
        role: "superadmin",
        provider: "credentials",
      });

      const token = jwt.sign(
        {
          userId: admin._id.toString(),
          email: admin.email,
          role: admin.role,
        },
        config.jwt.secret as Secret,
        { expiresIn: config.jwt.expiresIn } as SignOptions
      );

      clearCookie(res, CUSTOMER_COOKIE);
      setCookie(res, ADMIN_COOKIE, token);

      res.status(201).json({
        success: true,
        message: "Superadmin initialized successfully",
        token,
        user: admin.toJSON(),
      });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

export default router;