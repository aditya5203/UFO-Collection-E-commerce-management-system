import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { JwtPayload } from "../types/auth.types";
import { AppError } from "../../../middleware/error.middleware";
import { User } from "../../../models";

const CUSTOMER_COOKIE = process.env.COOKIE_NAME || "token";
const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "adminToken";
const DELIVERY_COOKIE = process.env.DELIVERY_COOKIE_NAME || "deliveryToken";

export type AuthRequest = Request & {
  user?: {
    userId?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
};

function clearAuthCookie(res: Response, cookieName: string) {
  res.clearCookie(cookieName, { path: "/" });
}

export const makeAuthMiddleware =
  (cookieName: string) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined;

      if (req.cookies && req.cookies[cookieName]) {
        token = req.cookies[cookieName] as string;
      }

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

      const dbUser = await User.findById(decoded.userId).select("_id role");

      if (!dbUser) {
        clearAuthCookie(res, cookieName);
        return next(new AppError("User not found or deleted", 401));
      }

      return next();
    } catch (error: any) {
      if (error?.name === "JsonWebTokenError") {
        clearAuthCookie(res, cookieName);
        return next(new AppError("Invalid token", 401));
      }

      if (error?.name === "TokenExpiredError") {
        clearAuthCookie(res, cookieName);
        return next(new AppError("Token expired", 401));
      }

      return next(error);
    }
  };

export const customerAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  return makeAuthMiddleware(CUSTOMER_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = String(req.user?.role || "").toLowerCase();

    if (role !== "customer") {
      clearAuthCookie(res, CUSTOMER_COOKIE);
      return next(new AppError("Customer access only", 403));
    }

    return next();
  });
};

export const adminAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  return makeAuthMiddleware(ADMIN_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = String(req.user?.role || "").toLowerCase();

    if (role !== "admin" && role !== "superadmin") {
      clearAuthCookie(res, ADMIN_COOKIE);
      return next(new AppError("Admin access only", 403));
    }

    return next();
  });
};

export const deliveryAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  return makeAuthMiddleware(DELIVERY_COOKIE)(req, res, (err?: any) => {
    if (err) return next(err);

    const role = String(req.user?.role || "").toLowerCase();

    if (role !== "delivery") {
      clearAuthCookie(res, DELIVERY_COOKIE);
      return next(new AppError("Delivery access only", 403));
    }

    return next();
  });
};

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

export const anyAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  makeAuthMiddleware(ADMIN_COOKIE)(req, res, (adminErr?: any) => {
    if (!adminErr && req.user?.userId) return next();

    req.user = undefined;

    makeAuthMiddleware(CUSTOMER_COOKIE)(req, res, (custErr?: any) => {
      if (!custErr && req.user?.userId) return next();

      req.user = undefined;

      makeAuthMiddleware(DELIVERY_COOKIE)(req, res, (_deliveryErr?: any) => {
        if (req.user?.userId) return next();

        req.user = undefined;
        return next();
      });
    });
  });
};

export default makeAuthMiddleware(CUSTOMER_COOKIE);