import mongoose from "mongoose";
import { User } from "../../../models/User.model";
import { Order } from "../../../models/Order.model";

export const customerService = {
  async listCustomers(search?: string) {
    const filter: any = { role: "customer" };

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("_id name email role createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u: any) => u._id).filter(Boolean);

    // ✅ count orders per customer
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
      lastLogin: u.updatedAt,
      numberOfOrders: countMap.get(String(u._id)) || 0,
    }));
  },

  async getCustomerById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const u: any = await User.findById(id)
      .select("_id name email role createdAt updatedAt")
      .lean();

    if (!u) return null;

    const totalOrders = await Order.countDocuments({ customer: u._id });

    return {
      id: String(u._id),
      name: u.name || "",
      email: u.email || "",
      role: u.role || "customer",
      createdAt: u.createdAt,
      lastLogin: u.updatedAt,
      numberOfOrders: totalOrders,
    };
  },
};
