import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { Product } from "../../../models/Product.model";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export const dashboardService = {
  async getSummary() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const from7 = startOfDay(addDays(todayStart, -6));
    const toTomorrow = startOfDay(addDays(todayStart, 1));

    const [totalOrders, totalCustomers, totalProductsLive, revenueAgg] =
      await Promise.all([
        Order.countDocuments({}),
        User.countDocuments({ role: { $in: ["user", "customer", "buyer"] } }).catch(
          async () => User.countDocuments({})
        ),
        Product.countDocuments({ status: "Active" }),
        Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPaisa" } } }]),
      ]);

    const totalRevenuePaisa = Number(revenueAgg?.[0]?.total || 0);
    const totalRevenueRs = Math.round(totalRevenuePaisa / 100);

    const recentOrdersRaw = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("customer", "name email")
      .lean();

    const recentOrders = (recentOrdersRaw as any[]).map((o) => ({
      id: String(o._id),
      orderCode: o.orderCode || "",
      totalPaisa: Number(o.totalPaisa || 0),
      totalRs: Math.round(Number(o.totalPaisa || 0) / 100),
      orderStatus: o.orderStatus || "Pending",
      paymentStatus: o.paymentStatus || "Pending",
      createdAt: o.createdAt,
      customerName: o.customer?.name || "Customer",
      customerEmail: o.customer?.email || "",
    }));

    const statusAgg = await Order.aggregate([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    const ordersByStatus: Record<string, number> = {
      Pending: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    for (const s of statusAgg) {
      const key = String(s._id || "");
      if (key in ordersByStatus) ordersByStatus[key] = Number(s.count || 0);
    }

    const salesAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: from7, $lt: toTomorrow } } },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          total: { $sum: "$totalPaisa" },
        },
      },
    ]);

    const salesLast7Days = Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(from7, i);
      const y = day.getFullYear();
      const m = day.getMonth() + 1;
      const d = day.getDate();

      const found = salesAgg.find(
        (x) => x?._id?.y === y && x?._id?.m === m && x?._id?.d === d
      );

      const totalPaisa = Number(found?.total || 0);

      return {
        date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        totalPaisa,
        totalRs: Math.round(totalPaisa / 100),
      };
    });

    const lowStockRaw = await Product.find({
      stock: { $lte: 10 },
      status: "Active",
    })
      .select("_id name stock")
      .sort({ stock: 1 })
      .limit(6)
      .lean();

    const lowStock = (lowStockRaw as any[]).map((p) => ({
      id: String(p._id),
      name: p.name || "",
      stock: Number(p.stock || 0),
    }));

    const newUsersRaw = await User.find({
      role: { $in: ["user", "customer", "buyer"] },
      createdAt: { $gte: from7, $lt: toTomorrow },
    })
      .select("_id name createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const newUsers = (newUsersRaw as any[]).map((u) => ({
      id: String(u._id),
      name: u.name || "User",
      createdAt: u.createdAt,
    }));

    return {
      top: {
        totalOrders,
        totalRevenuePaisa,
        totalRevenueRs,
        totalCustomers,
        totalProductsLive,
      },
      ordersByStatus,
      salesLast7Days,
      recentOrders,
      lowStock,
      newUsers,
    };
  },
};

export default dashboardService;
