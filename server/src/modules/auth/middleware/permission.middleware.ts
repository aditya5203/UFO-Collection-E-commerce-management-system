// server/src/modules/auth/middleware/permission.middleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { AppError } from "../../../middleware/error.middleware";
import {
  User,
  IAdminPermissions,
  fullSuperadminPermissions,
} from "../../../models/User.model";

export type AdminPermissionKey = keyof IAdminPermissions;

export const authorizePermission =
  (...requiredPermissions: AdminPermissionKey[]) =>
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const userId = String(req.user?.userId || "");
      const role = String(req.user?.role || "").toLowerCase();

      if (!userId) {
        return next(new AppError("User not authenticated", 401));
      }

      if (role === "superadmin") {
        req.user = {
          ...req.user,
          permissions: fullSuperadminPermissions(),
        };
        return next();
      }

      if (role !== "admin") {
        return next(new AppError("Admin access only", 403));
      }

      const dbUser = await User.findById(userId)
        .select("role status isBlocked permissions")
        .lean();

      if (!dbUser) {
        return next(new AppError("Admin not found", 404));
      }

      if ((dbUser as any).isBlocked) {
        return next(new AppError("This admin account has been blocked.", 403));
      }

      if (String((dbUser as any).status || "").toLowerCase() === "inactive") {
        return next(new AppError("This admin account is inactive.", 403));
      }

      const permissions = ((dbUser as any).permissions || {}) as Partial<IAdminPermissions>;

      const hasAll = requiredPermissions.every((key) => Boolean(permissions[key]));

      if (!hasAll) {
        return next(new AppError("Access denied. Insufficient permissions", 403));
      }

      req.user = {
        ...req.user,
        permissions,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };