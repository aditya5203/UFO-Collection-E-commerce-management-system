import { Response, NextFunction } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { AppError } from "../../../middleware/error.middleware";
import {
  User,
  IAdminPermissions,
  defaultAdminPermissions,
  fullSuperadminPermissions,
} from "../../../models/User.model";
import {
  createInviteToken,
  sendAdminInviteEmail,
} from "../../../services/invite.service";

function sanitizePermissions(input: any): IAdminPermissions {
  const base = defaultAdminPermissions();

  if (!input || typeof input !== "object") return base;

  return {
    dashboardView: !!input.dashboardView,

    customerView: !!input.customerView,
    customerEdit: !!input.customerEdit,
    customerDelete: !!input.customerDelete,

    orderView: !!input.orderView,
    orderUpdate: !!input.orderUpdate,
    orderDelete: !!input.orderDelete,

    categoryView: !!input.categoryView,
    categoryCreate: !!input.categoryCreate,
    categoryEdit: !!input.categoryEdit,
    categoryDelete: !!input.categoryDelete,

    productView: !!input.productView,
    productCreate: !!input.productCreate,
    productEdit: !!input.productEdit,
    productDelete: !!input.productDelete,

    reviewView: !!input.reviewView,
    reviewDelete: !!input.reviewDelete,

    discountView: !!input.discountView,
    discountCreate: !!input.discountCreate,
    discountEdit: !!input.discountEdit,
    discountDelete: !!input.discountDelete,

    analyticsView: !!input.analyticsView,

    settingsView: !!input.settingsView,

    adminsView: !!input.adminsView,
    adminsCreate: !!input.adminsCreate,
    adminsEdit: !!input.adminsEdit,
    adminsDelete: !!input.adminsDelete,
    adminsStatus: !!input.adminsStatus,
    adminsResetPassword: !!input.adminsResetPassword,

    notificationView: !!input.notificationView,

    ticketView: !!input.ticketView,
    ticketReply: !!input.ticketReply,
    ticketClose: !!input.ticketClose,

    liveChatView: !!input.liveChatView,
    liveChatReply: !!input.liveChatReply,

    supportView: !!input.supportView,
    supportReply: !!input.supportReply,

    advertisementView: !!input.advertisementView,
    advertisementCreate: !!input.advertisementCreate,
    advertisementEdit: !!input.advertisementEdit,
    advertisementDelete: !!input.advertisementDelete,
  };
}

export const adminsController = {
  async list(
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const items = await User.find({
        role: { $in: ["admin", "superadmin"] },
      })
        .select(
          "_id name email role status mustChangePassword permissions createdAt"
        )
        .sort({ createdAt: -1 })
        .lean();

      const out = items.map((u: any) => {
        const role = String(u.role || "").toLowerCase();

        return {
          _id: String(u._id),
          name: u.name || "",
          email: u.email || "",
          role: u.role,
          status: u.status || "active",
          mustChangePassword: !!u.mustChangePassword,
          permissions:
            role === "superadmin"
              ? fullSuperadminPermissions()
              : sanitizePermissions(u.permissions),
        };
      });

      res.json({ success: true, items: out });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async invite(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentRole = String(req.user?.role || "").toLowerCase();
      if (currentRole !== "superadmin") {
        throw new AppError("Superadmin only", 403);
      }

      const currentUserId = String(req.user?.userId || "");
      const inviterName = String((req.user as any)?.name || "").trim();

      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const newRole = String(req.body?.role || "admin").toLowerCase();

      if (!name) throw new AppError("Name is required", 400);
      if (!email) throw new AppError("Email is required", 400);
      if (newRole !== "admin") {
        throw new AppError("Only admin invitations are allowed here", 400);
      }

      const exists = await User.findOne({ email });
      if (exists) throw new AppError("Email already exists", 409);

      const permissions = sanitizePermissions(req.body?.permissions);
      const { rawToken, tokenHash, expiresAt } = createInviteToken();

      const user = await User.create({
        name,
        email,
        role: "admin",
        status: "invited",
        mustChangePassword: true,
        permissions,
        provider: "credentials",
        inviteTokenHash: tokenHash,
        inviteTokenExpires: expiresAt,
        inviteAcceptedAt: null,
        invitedBy: currentUserId || null,
      });

      await sendAdminInviteEmail({
        to: user.email,
        name: user.name,
        invitedByName: inviterName || "Superadmin",
        token: rawToken,
      });

      res.status(201).json({
        success: true,
        message: "Admin invitation sent successfully",
        item: {
          _id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status || "invited",
          mustChangePassword: !!user.mustChangePassword,
          permissions: sanitizePermissions(user.permissions),
        },
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentRole = String(req.user?.role || "").toLowerCase();
      if (currentRole !== "superadmin") {
        throw new AppError("Superadmin only", 403);
      }

      const adminId = String(req.params?.id || "");
      if (!adminId) throw new AppError("Admin id is required", 400);

      const target: any = await User.findById(adminId);
      if (!target) throw new AppError("Admin not found", 404);

      if (target.role !== "admin") {
        throw new AppError("Only admin accounts can be updated here", 400);
      }

      if (req.body?.name !== undefined) {
        const nextName = String(req.body.name || "").trim();
        if (!nextName) throw new AppError("Name is required", 400);
        target.name = nextName;
      }

      if (req.body?.email !== undefined) {
        const nextEmail = String(req.body.email || "").trim().toLowerCase();
        if (!nextEmail) throw new AppError("Email is required", 400);

        const exists = await User.findOne({
          email: nextEmail,
          _id: { $ne: adminId },
        }).lean();

        if (exists) throw new AppError("Email already exists", 409);
        target.email = nextEmail;
      }

      if (req.body?.status !== undefined) {
        const nextStatus = String(req.body.status || "").toLowerCase();
        if (!["active", "inactive", "invited"].includes(nextStatus)) {
          throw new AppError("Invalid status", 400);
        }
        target.status = nextStatus;
      }

      if (req.body?.permissions !== undefined) {
        target.permissions = sanitizePermissions(req.body.permissions);
      }

      await target.save();

      res.json({
        success: true,
        item: {
          _id: String(target._id),
          name: target.name,
          email: target.email,
          role: target.role,
          status: target.status || "active",
          mustChangePassword: !!target.mustChangePassword,
          permissions: sanitizePermissions(target.permissions),
        },
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async toggleStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentRole = String(req.user?.role || "").toLowerCase();
      if (currentRole !== "superadmin") {
        throw new AppError("Superadmin only", 403);
      }

      const adminId = String(req.params?.id || "");
      if (!adminId) throw new AppError("Admin id is required", 400);

      const target: any = await User.findById(adminId);
      if (!target) throw new AppError("Admin not found", 404);

      if (target.role !== "admin") {
        throw new AppError("Only admin accounts can be updated here", 400);
      }

      target.status = target.status === "inactive" ? "active" : "inactive";
      await target.save();

      res.json({
        success: true,
        message:
          target.status === "inactive"
            ? "Admin deactivated successfully"
            : "Admin activated successfully",
        item: {
          _id: String(target._id),
          status: target.status,
        },
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },

  async remove(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const currentRole = String(req.user?.role || "").toLowerCase();
      if (currentRole !== "superadmin") {
        throw new AppError("Superadmin only", 403);
      }

      const currentUserId = String(req.user?.userId || "");
      const targetId = String(req.params?.id || "");

      if (!targetId) {
        throw new AppError("Admin id is required", 400);
      }

      if (currentUserId === targetId) {
        throw new AppError("You cannot delete your own account", 400);
      }

      const targetUser: any = await User.findById(targetId);
      if (!targetUser) {
        throw new AppError("Admin not found", 404);
      }

      if (targetUser.role !== "admin") {
        throw new AppError("Only admin accounts can be deleted here", 400);
      }

      await User.findByIdAndDelete(targetId);

      res.json({
        success: true,
        message: "Admin permanently deleted successfully",
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};