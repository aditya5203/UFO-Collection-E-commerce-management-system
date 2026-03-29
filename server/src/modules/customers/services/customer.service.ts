// server/src/modules/customers/services/customer.service.ts
import mongoose from "mongoose";
import { User } from "../../../models/User.model";
import { Order } from "../../../models/Order.model";

type CustomerFilter = "all" | "blocked" | "deleted";

export const customerService = {
  async listCustomers(search?: string, filter: CustomerFilter = "all") {
    const match: any = {
      role: "customer",
    };

    if (search?.trim()) {
      match.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (filter === "blocked") {
      match.isDeleted = { $ne: true };
      match.isBlocked = true;
    } else if (filter === "deleted") {
      match.isDeleted = true;
    } else {
      match.isDeleted = { $ne: true };
    }

    const users = await User.aggregate([
      { $match: match },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
          lastLogin: 1,
          isBlocked: 1,
          blockedAt: 1,
          isDeleted: 1,
          deletedAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const userIds = users.map((u: any) => u._id).filter(Boolean);

    const counts = await Order.aggregate([
      { $match: { customer: { $in: userIds } } },
      { $group: { _id: "$customer", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>(
      counts.map((c: any) => [String(c._id), Number(c.count || 0)])
    );

    return users.map((u: any) => ({
      id: String(u._id),
      name: u.name || "",
      email: u.email || "",
      role: u.role || "customer",
      createdAt: u.createdAt,
      lastLogin: u.lastLogin || null,
      numberOfOrders: countMap.get(String(u._id)) || 0,
      status: u.isDeleted ? "deleted" : u.isBlocked ? "blocked" : "active",
      isBlocked: Boolean(u.isBlocked),
      isDeleted: Boolean(u.isDeleted),
      blockedAt: u.blockedAt || null,
      deletedAt: u.deletedAt || null,
    }));
  },

  async getCustomerById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const objectId = new mongoose.Types.ObjectId(id);

    const users = await User.aggregate([
      { $match: { _id: objectId, role: "customer" } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
          lastLogin: 1,
          isBlocked: 1,
          blockedAt: 1,
          isDeleted: 1,
          deletedAt: 1,
        },
      },
      { $limit: 1 },
    ]);

    const u: any = users[0];
    if (!u) return null;

    const totalOrders = await Order.countDocuments({ customer: u._id });

    return {
      id: String(u._id),
      name: u.name || "",
      email: u.email || "",
      role: u.role || "customer",
      createdAt: u.createdAt,
      lastLogin: u.lastLogin || null,
      numberOfOrders: totalOrders,
      status: u.isDeleted ? "deleted" : u.isBlocked ? "blocked" : "active",
      isBlocked: Boolean(u.isBlocked),
      isDeleted: Boolean(u.isDeleted),
      blockedAt: u.blockedAt || null,
      deletedAt: u.deletedAt || null,
    };
  },

  async blockCustomer(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const updated = await User.findOneAndUpdate(
      { _id: id, role: "customer", isDeleted: { $ne: true } },
      {
        $set: {
          isBlocked: true,
          blockedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) return null;

    return {
      id: String(updated._id),
      status: "blocked",
      isBlocked: true,
      blockedAt: updated.blockedAt || null,
    };
  },

  async unblockCustomer(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const updated = await User.findOneAndUpdate(
      { _id: id, role: "customer", isDeleted: { $ne: true } },
      {
        $set: {
          isBlocked: false,
          blockedAt: null,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) return null;

    return {
      id: String(updated._id),
      status: "active",
      isBlocked: false,
      blockedAt: null,
    };
  },

  async deleteCustomer(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const updated = await User.findOneAndUpdate(
      { _id: id, role: "customer", isDeleted: { $ne: true } },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isBlocked: false,
          blockedAt: null,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) return null;

    return {
      id: String(updated._id),
      status: "deleted",
      isDeleted: true,
      deletedAt: updated.deletedAt || null,
    };
  },
};