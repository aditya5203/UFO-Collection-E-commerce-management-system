// server/src/modules/auth/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { JwtPayload } from "../types/auth.types";
import { AppError } from "../../../middleware/error.middleware";

export type AuthRequest = Request & {
  user?: {
    userId?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
};

// ✅ cookie names
const CUSTOMER_COOKIE = process.env.COOKIE_NAME || "token";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "adminToken";

// ✅ Base middleware factory: only verifies token and sets req.user
export const makeAuthMiddleware =
  (cookieName: string) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      // 1) Cookie
      if (req.cookies && req.cookies[cookieName]) {
        token = req.cookies[cookieName] as string;
      }

      // 2) Authorization header fallback
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      if (!token) throw new AppError("No token provided", 401);

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error: any) {
      if (error?.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token", 401));
      }
      if (error?.name === "TokenExpiredError") {
        return next(new AppError("Token expired", 401));
      }
      return next(error);
    }
  };

// ✅ Customer auth (requires customer role)
export const customerAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  return makeAuthMiddleware(CUSTOMER_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = (req.user?.role || "").toLowerCase();
    if (role !== "customer") {
      return next(new AppError("Customer access only", 403));
    }

    next();
  });
};

// ✅ Admin auth (requires admin/superadmin role)
export const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  return makeAuthMiddleware(ADMIN_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = (req.user?.role || "").toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
      return next(new AppError("Admin access only", 403));
    }

    next();
  });
};

// ✅ Role-based authorization (must run AFTER an auth middleware that sets req.user)
export const authorize =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    const userRole = (req.user.role || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return next(new AppError("Access denied. Insufficient permissions", 403));
    }

    next();
  };

// ✅ Default export: base "auth only" (NO role restriction)
// This prevents accidental "customer only" lockouts in admin routers.
export default makeAuthMiddleware(CUSTOMER_COOKIE);
