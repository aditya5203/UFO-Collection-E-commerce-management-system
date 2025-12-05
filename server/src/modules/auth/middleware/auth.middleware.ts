// server/src/modules/auth/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { JwtPayload } from "../types/auth.types";
import { AppError } from "../../../middleware/error.middleware";

// Local type for requests where we use req.user
export type AuthRequest = Request & {
  user?: {
    userId?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
};

/**
 * Authentication middleware
 * - Reads token from Authorization: Bearer <token> OR cookies.token
 * - Verifies JWT
 * - Attaches { userId, email, role } to req.user
 */
export const authMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // 1) Try Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2) Fallback to cookie token
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token as string;
    }

    // 3) No token → unauthorized
    if (!token) {
      throw new AppError("No token provided", 401);
    }

    // 4) Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 5) Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired", 401));
    }
    next(error);
  }
};

/**
 * Role-based authorization
 * Usage:
 *   router.get("/admin",
 *     authMiddleware,
 *     authorize("admin", "superadmin"),
 *     handler
 *   );
 */
export const authorize =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User not authenticated", 401));
    }

    if (!roles.includes(req.user.role || "")) {
      return next(
        new AppError("Access denied. Insufficient permissions", 403)
      );
    }

    next();
  };

// Default export so you can do: import authMiddleware from "../middleware/auth.middleware";
export default authMiddleware;
