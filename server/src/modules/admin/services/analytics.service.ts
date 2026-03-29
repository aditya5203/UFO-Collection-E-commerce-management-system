import { Order } from "../../../models/Order.model";
import { Product } from "../../../models/Product.model";
import { User } from "../../../models/User.model";

export type RangeKey = "today" | "7days" | "30days";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function percentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";

  const value = ((current - previous) / previous) * 100;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function formatCurrencyRs(amountRs: number) {
  return `Rs. ${amountRs.toLocaleString("en-US")}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getRangeDates(range: RangeKey) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = startOfDay(addDays(todayStart, 1));

  if (range === "today") {
    return {
      startDate: todayStart,
      endDate: tomorrowStart,
      previousStartDate: startOfDay(addDays(todayStart, -1)),
      previousEndDate: todayStart,
      totalDays: 1,
    };
  }

  if (range === "30days") {
    return {
      startDate: startOfDay(addDays(todayStart, -29)),
      endDate: tomorrowStart,
      previousStartDate: startOfDay(addDays(todayStart, -59)),
      previousEndDate: startOfDay(addDays(todayStart, -29)),
      totalDays: 30,
    };
  }

  return {
    startDate: startOfDay(addDays(todayStart, -6)),
    endDate: tomorrowStart,
    previousStartDate: startOfDay(addDays(todayStart, -13)),
    previousEndDate: startOfDay(addDays(todayStart, -6)),
    totalDays: 7,
  };
}

function getCustomDates(from?: string, to?: string) {
  if (!from || !to) return null;

  const fromDate = startOfDay(new Date(from));
  const toDate = endOfDay(new Date(to));

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid from/to date");
  }

  if (fromDate > toDate) {
    throw new Error("'From' date cannot be greater than 'To' date");
  }

  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 92) {
    throw new Error("Date range cannot be more than 3 months");
  }

  const previousEndDate = startOfDay(fromDate);
  const previousStartDate = startOfDay(addDays(fromDate, -(diffDays + 1)));

  return {
    startDate: fromDate,
    endDate: new Date(toDate.getTime() + 1),
    previousStartDate,
    previousEndDate,
    totalDays: diffDays + 1,
  };
}

function buildDateLabels(startDate: Date, totalDays: number, range: RangeKey | "custom") {
  return Array.from({ length: totalDays }).map((_, index) => {
    const day = addDays(startDate, index);

    if (range === "today") {
      return day.toLocaleDateString("en-US", { weekday: "short" });
    }

    if (range === "7days") {
      return day.toLocaleDateString("en-US", { weekday: "short" });
    }

    return day.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  });
}

async function getPaymentMethodUsage(startDate: Date, endDate: Date) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate },
        orderStatus: { $ne: "Cancelled" },
      },
    },
    {
      $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = {
    COD: 0,
    Khalti: 0,
    eSewa: 0,
  };

  for (const item of result) {
    const key = String(item._id || "");
    if (key === "COD" || key === "Khalti" || key === "eSewa") {
      counts[key] = Number(item.count || 0);
    }
  }

  const maxCount = Math.max(counts.COD, counts.Khalti, counts.eSewa, 1);

  const paymentMethodData = [
    {
      label: "COD",
      value: Math.round((counts.COD / maxCount) * 100),
      count: counts.COD,
    },
    {
      label: "Khalti",
      value: Math.round((counts.Khalti / maxCount) * 100),
      count: counts.Khalti,
    },
    {
      label: "eSewa",
      value: Math.round((counts.eSewa / maxCount) * 100),
      count: counts.eSewa,
    },
  ];

  let mostUsedMethod = "COD";
  let mostUsedCount = counts.COD;

  if (counts.Khalti > mostUsedCount) {
    mostUsedMethod = "Khalti";
    mostUsedCount = counts.Khalti;
  }

  if (counts.eSewa > mostUsedCount) {
    mostUsedMethod = "eSewa";
    mostUsedCount = counts.eSewa;
  }

  return {
    paymentMethodData,
    mostUsedMethod,
    mostUsedCount,
  };
}

export const analyticsService = {
  async getAnalytics(input?: {
    range?: RangeKey;
    from?: string;
    to?: string;
  }) {
    const safeRange: RangeKey =
      input?.range === "today" || input?.range === "30days" || input?.range === "7days"
        ? input.range
        : "7days";

    const customDates = getCustomDates(input?.from, input?.to);

    const {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      totalDays,
    } = customDates || getRangeDates(safeRange);

    const rangeLabel: RangeKey | "custom" = customDates ? "custom" : safeRange;

    const paidMatch = {
      createdAt: { $gte: startDate, $lt: endDate },
      paymentStatus: "Paid",
      orderStatus: { $ne: "Cancelled" },
    };

    const previousPaidMatch = {
      createdAt: { $gte: previousStartDate, $lt: previousEndDate },
      paymentStatus: "Paid",
      orderStatus: { $ne: "Cancelled" },
    };

    const allOrdersMatch = {
      createdAt: { $gte: startDate, $lt: endDate },
      orderStatus: { $ne: "Cancelled" },
    };

    const previousAllOrdersMatch = {
      createdAt: { $gte: previousStartDate, $lt: previousEndDate },
      orderStatus: { $ne: "Cancelled" },
    };

    const [
      currentRevenueAgg,
      previousRevenueAgg,
      allOrdersCount,
      previousAllOrdersCount,
      paidOrdersCount,
      previousPaidOrdersCount,
      newCustomersCount,
      previousNewCustomersCount,
      totalCustomers,
      salesTrendAgg,
      customerAcquisitionAgg,
      categoryRevenueAgg,
      topSellingAgg,
      leastSellingAgg,
      geographicAgg,
      activeCustomerAgg,
      paymentMethodUsage,
    ] = await Promise.all([
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: "$totalPaisa" } } },
      ]),
      Order.aggregate([
        { $match: previousPaidMatch },
        { $group: { _id: null, total: { $sum: "$totalPaisa" } } },
      ]),
      Order.countDocuments(allOrdersMatch),
      Order.countDocuments(previousAllOrdersMatch),
      Order.countDocuments(paidMatch),
      Order.countDocuments(previousPaidMatch),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: startDate, $lt: endDate },
      }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: previousStartDate, $lt: previousEndDate },
      }),
      User.countDocuments({ role: "customer" }),
      Order.aggregate([
        { $match: paidMatch },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            totalPaisa: { $sum: "$totalPaisa" },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            role: "customer",
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "product.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$category.name",
            totalPaisa: {
              $sum: { $multiply: ["$items.qty", "$items.pricePaisa"] },
            },
          },
        },
        { $sort: { totalPaisa: -1 } },
        { $limit: 6 },
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            qtySold: { $sum: "$items.qty" },
          },
        },
        { $sort: { qtySold: -1, _id: 1 } },
        { $limit: 2 },
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            qtySold: { $sum: "$items.qty" },
          },
        },
        { $sort: { qtySold: 1, _id: 1 } },
        { $limit: 2 },
      ]),
      Order.aggregate([
        { $match: allOrdersMatch },
        {
          $group: {
            _id: "$address.cityOrMunicipality",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 3 },
      ]),
      Order.aggregate([
        { $match: allOrdersMatch },
        {
          $group: {
            _id: "$customer",
            ordersCount: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            returning: {
              $sum: {
                $cond: [{ $gt: ["$ordersCount", 1] }, 1, 0],
              },
            },
          },
        },
      ]),
      getPaymentMethodUsage(startDate, endDate),
    ]);

    const totalRevenuePaisa = Number(currentRevenueAgg?.[0]?.total || 0);
    const previousRevenuePaisa = Number(previousRevenueAgg?.[0]?.total || 0);

    const totalRevenueRs = Math.round(totalRevenuePaisa / 100);
    const previousRevenueRs = Math.round(previousRevenuePaisa / 100);

    const averageOrderValueRs =
      paidOrdersCount > 0 ? Math.round(totalRevenueRs / paidOrdersCount) : 0;

    const previousAverageOrderValueRs =
      previousPaidOrdersCount > 0 ? Math.round(previousRevenueRs / previousPaidOrdersCount) : 0;

    const conversionRate =
      allOrdersCount > 0 ? (paidOrdersCount / allOrdersCount) * 100 : 0;

    const previousConversionRate =
      previousAllOrdersCount > 0 ? (previousPaidOrdersCount / previousAllOrdersCount) * 100 : 0;

    const salesTrendGrowth =
      previousRevenueRs > 0
        ? ((totalRevenueRs - previousRevenueRs) / previousRevenueRs) * 100
        : totalRevenueRs > 0
        ? 100
        : 0;

    const labels = buildDateLabels(startDate, totalDays, rangeLabel);

    const salesTrendData = Array.from({ length: totalDays }).map((_, index) => {
      const day = addDays(startDate, index);
      const y = day.getFullYear();
      const m = day.getMonth() + 1;
      const d = day.getDate();

      const found = salesTrendAgg.find(
        (item) => item?._id?.y === y && item?._id?.m === m && item?._id?.d === d
      );

      return Math.round(Number(found?.totalPaisa || 0) / 100);
    });

    const maxCategory = Math.max(
      ...categoryRevenueAgg.map((item) => Number(item.totalPaisa || 0)),
      1
    );

    const revenueCategoryData = categoryRevenueAgg.map((item) => ({
      label: item._id || "Unknown",
      value: Math.max(8, Math.round((Number(item.totalPaisa || 0) / maxCategory) * 100)),
      revenueRs: Math.round(Number(item.totalPaisa || 0) / 100),
    }));

    const acquisitionCounts = Array.from({ length: totalDays }).map((_, index) => {
      const day = addDays(startDate, index);
      const y = day.getFullYear();
      const m = day.getMonth() + 1;
      const d = day.getDate();

      const found = customerAcquisitionAgg.find(
        (item) => item?._id?.y === y && item?._id?.m === m && item?._id?.d === d
      );

      return Number(found?.count || 0);
    });

    const maxAcquisition = Math.max(...acquisitionCounts, 1);
    const customerAcquisitionData = acquisitionCounts.map((count) =>
      Math.round((count / maxAcquisition) * 100)
    );

    const activeCustomerStats = activeCustomerAgg?.[0] || { total: 0, returning: 0 };
    const activeCustomerCount = Number(activeCustomerStats.total || 0);
    const returningCount = Number(activeCustomerStats.returning || 0);
    const newCount = Math.max(activeCustomerCount - returningCount, 0);

    const newPercent =
      activeCustomerCount > 0 ? Math.round((newCount / activeCustomerCount) * 100) : 0;
    const returningPercent =
      activeCustomerCount > 0 ? Math.round((returningCount / activeCustomerCount) * 100) : 0;

    const customerLifetimeValueRs =
      activeCustomerCount > 0 ? Math.round(totalRevenueRs / activeCustomerCount) : 0;

    const geoText =
      geographicAgg.length > 0
        ? geographicAgg.map((item) => item._id || "Unknown").join(", ")
        : "No data";

    return {
      range: safeRange,
      summaryCards: {
        salesTrendAmount: formatCurrencyRs(totalRevenueRs),
        salesTrendChange: percentChange(totalRevenueRs, previousRevenueRs),
        categoryRevenueAmount: formatCurrencyRs(
          revenueCategoryData.reduce((sum, item) => sum + Number(item.revenueRs || 0), 0)
        ),
        categoryRevenueChange: percentChange(totalRevenueRs, previousRevenueRs),
        customerAcquisitionTotal: newCustomersCount,
        customerAcquisitionChange: percentChange(newCustomersCount, previousNewCustomersCount),
        paymentMethodTop: paymentMethodUsage.mostUsedMethod,
        paymentMethodTopCount: paymentMethodUsage.mostUsedCount,
      },
      metrics: [
        {
          label: "Total Revenue",
          value: formatCurrencyRs(totalRevenueRs),
          change: percentChange(totalRevenueRs, previousRevenueRs),
          positive: totalRevenueRs >= previousRevenueRs,
        },
        {
          label: "Average Order Value",
          value: formatCurrencyRs(averageOrderValueRs),
          change: percentChange(averageOrderValueRs, previousAverageOrderValueRs),
          positive: averageOrderValueRs >= previousAverageOrderValueRs,
        },
        {
          label: "Conversion Rate",
          value: formatPercent(conversionRate),
          change: percentChange(conversionRate, previousConversionRate),
          positive: conversionRate >= previousConversionRate,
        },
        {
          label: "Sales Trends",
          value: `${salesTrendGrowth >= 0 ? "+" : ""}${Math.round(salesTrendGrowth)}%`,
          change: percentChange(totalRevenueRs, previousRevenueRs),
          positive: salesTrendGrowth >= 0,
        },
      ],
      salesTrendData,
      salesTrendLabels: labels,
      revenueCategoryData,
      customerBehaviorCards: [
        {
          title: "New vs. Returning Customers",
          value: `${newPercent}% / ${returningPercent}%`,
          change: percentChange(newCount, returningCount),
        },
        {
          title: "Customer Lifetime Value",
          value: formatCurrencyRs(customerLifetimeValueRs),
          change: percentChange(customerLifetimeValueRs, previousAverageOrderValueRs),
        },
        {
          title: "Geographic Distribution",
          value: geoText,
          change: `${geographicAgg.length} regions`,
        },
      ],
      customerAcquisitionData,
      customerAcquisitionLabels: labels,
      productPerformanceCards: [
        {
          title: "Top Selling Products",
          value:
            topSellingAgg.length > 0
              ? topSellingAgg.map((item) => item._id).join(", ")
              : "No sales yet",
          change: `+${topSellingAgg.reduce(
            (sum, item) => sum + Number(item.qtySold || 0),
            0
          )} sold`,
          positive: true,
        },
        {
          title: "Least Selling Products",
          value:
            leastSellingAgg.length > 0
              ? leastSellingAgg.map((item) => item._id).join(", ")
              : "No sales yet",
          change: `${leastSellingAgg.reduce(
            (sum, item) => sum + Number(item.qtySold || 0),
            0
          )} sold`,
          positive: false,
        },
      ],
      paymentMethodUsage,
      extra: {
        totalCustomers,
        totalOrders: allOrdersCount,
      },
    };
  },
};

export default analyticsService;