import { Response, NextFunction } from "express";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { AppError } from "../../../middleware/error.middleware";
import { User } from "../../../models/User.model";

export const adminsController = {
  // GET /api/admins
  async list(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await User.find({ role: { $in: ["admin", "superadmin"] } })
        .select("_id name email role createdAt")
        .sort({ createdAt: -1 })
        .lean();

      // shape to match your frontend AdminRow
      const out = items.map((u: any) => ({
        _id: String(u._id),
        name: u.name || "",
        email: u.email || "",
        role: u.role,
        status: "active", // if you later add status/isBlocked, map it here
      }));

      return res.json({ items: out });
    } catch (e) {
      next(e);
    }
  },

  // POST /api/admins (superadmin only)
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = String(req.user?.role || "").toLowerCase();
      if (role !== "superadmin") throw new AppError("Superadmin only", 403);

      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      const newRole = String(req.body?.role || "admin").toLowerCase();

      if (!name) throw new AppError("Name is required", 400);
      if (!email) throw new AppError("Email is required", 400);
      if (password.length < 8) throw new AppError("Password must be at least 8 characters", 400);
      if (newRole !== "admin" && newRole !== "superadmin") throw new AppError("Invalid role", 400);

      const exists = await User.findOne({ email });
      if (exists) throw new AppError("Email already exists", 409);

      // ✅ hashes automatically via your pre("save")
      const user = await User.create({
        name,
        email,
        password,
        role: newRole,
        provider: "credentials",
      });

      return res.status(201).json({
        success: true,
        item: {
          _id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          status: "active",
        },
      });
    } catch (e) {
      next(e);
    }
  },
};
