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

// ✅ Base middleware factory: verifies token and sets req.user
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

// ✅ Customer auth: allow ANY logged-in non-admin user
export const customerAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  return makeAuthMiddleware(CUSTOMER_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = String(req.user?.role || "").toLowerCase();

    // block admin roles from customer endpoints
    if (role === "admin" || role === "superadmin") {
      return next(new AppError("Customer access only", 403));
    }

    return next();
  });
};

// ✅ Admin auth: must be admin/superadmin
export const adminAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  return makeAuthMiddleware(ADMIN_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = String(req.user?.role || "").toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
      return next(new AppError("Admin access only", 403));
    }

    return next();
  });
};

// ✅ Role-based authorization
export const authorize =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    const userRole = String(req.user.role || "").toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return next(new AppError("Access denied. Insufficient permissions", 403));
    }

    return next();
  };

// ✅ NEW: allow BOTH admin OR customer (used for invoice download)
export const anyAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Try admin token first
  makeAuthMiddleware(ADMIN_COOKIE)(req, res, (adminErr?: any) => {
    if (!adminErr && req.user?.userId) return next();

    // If admin token not valid, try customer token
    makeAuthMiddleware(CUSTOMER_COOKIE)(req, res, (custErr?: any) => {
      if (custErr) return next(custErr);
      return next();
    });
  });
};

// ✅ Default export: auth only (no role restriction)
export default makeAuthMiddleware(CUSTOMER_COOKIE);
