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
  async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = String(req.user?.userId || "");
      const email = String(req.user?.email || "");
      const role = String(req.user?.role || "").toLowerCase();

      if (!userId) {
        next(new AppError("User not authenticated", 401));
        return;
      }

      if (role === "superadmin") {
        req.user = {
          userId,
          email,
          role,
          permissions: fullSuperadminPermissions(),
        };
        next();
        return;
      }

      if (role !== "admin") {
        next(new AppError("Admin access only", 403));
        return;
      }

      const dbUser = await User.findById(userId)
        .select("role status isBlocked permissions email")
        .lean();

      if (!dbUser) {
        next(new AppError("Admin not found", 404));
        return;
      }

      if ((dbUser as any).isBlocked) {
        next(new AppError("This admin account has been blocked.", 403));
        return;
      }

      if (String((dbUser as any).status || "").toLowerCase() === "inactive") {
        next(new AppError("This admin account is inactive.", 403));
        return;
      }

      const permissions = (((dbUser as any).permissions || {}) ??
        {}) as Partial<IAdminPermissions>;

      const hasAll = requiredPermissions.every((key) =>
        Boolean(permissions[key])
      );

      if (!hasAll) {
        next(new AppError("Access denied. Insufficient permissions", 403));
        return;
      }

      req.user = {
        userId,
        email: String((dbUser as any).email || email || ""),
        role,
        permissions,
      };

      next();
      return;
    } catch (error) {
      next(error);
      return;
    }
  };