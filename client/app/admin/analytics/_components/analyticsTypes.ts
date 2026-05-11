export type RangeKey = "today" | "7days" | "30days";

export type MetricCard = {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
};

export type CategoryItem = {
  label: string;
  value: number;
  revenueRs?: number;
};

export type InfoCardData = {
  title: string;
  value: string;
  change: string;
};

export type ProductCardData = {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
};

export type PaymentMethodItem = {
  label: string;
  value: number;
  count: number;
};

export type AnalyticsResponse = {
  success?: boolean;
  message?: string;
  data?: {
    range: RangeKey;
    summaryCards: {
      salesTrendAmount: string;
      salesTrendChange: string;
      categoryRevenueAmount: string;
      categoryRevenueChange: string;
      customerAcquisitionTotal: number;
      customerAcquisitionChange: string;
      paymentMethodTop: string;
      paymentMethodTopCount: number;
    };
    metrics: MetricCard[];
    salesTrendData: number[];
    salesTrendLabels: string[];
    revenueCategoryData: CategoryItem[];
    customerBehaviorCards: InfoCardData[];
    customerAcquisitionData: number[];
    customerAcquisitionLabels: string[];
    productPerformanceCards: ProductCardData[];
    paymentMethodUsage: {
      paymentMethodData: PaymentMethodItem[];
      mostUsedMethod: string;
      mostUsedCount: number;
    };
  };
};

export const rangeTabs: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7days", label: "Last 7 days" },
  { key: "30days", label: "Last 30 days" },
];

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const fallbackData: NonNullable<AnalyticsResponse["data"]> = {
  range: "7days",
  summaryCards: {
    salesTrendAmount: "Rs. 0",
    salesTrendChange: "0%",
    categoryRevenueAmount: "Rs. 0",
    categoryRevenueChange: "0%",
    customerAcquisitionTotal: 0,
    customerAcquisitionChange: "0%",
    paymentMethodTop: "COD",
    paymentMethodTopCount: 0,
  },
  metrics: [
    { label: "Total Revenue", value: "Rs. 0", change: "0%", positive: true },
    {
      label: "Average Order Value",
      value: "Rs. 0",
      change: "0%",
      positive: true,
    },
    { label: "Conversion Rate", value: "0%", change: "0%", positive: true },
    { label: "Sales Trends", value: "0%", change: "0%", positive: true },
  ],
  salesTrendData: [0, 0, 0, 0, 0, 0, 0],
  salesTrendLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  revenueCategoryData: [],
  customerBehaviorCards: [
    { title: "New vs. Returning Customers", value: "0% / 0%", change: "0%" },
    { title: "Customer Lifetime Value", value: "Rs. 0", change: "0%" },
    {
      title: "Geographic Distribution",
      value: "No data",
      change: "0 regions",
    },
  ],
  customerAcquisitionData: [0, 0, 0, 0, 0, 0, 0],
  customerAcquisitionLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  productPerformanceCards: [
    {
      title: "Top Selling Products",
      value: "No sales yet",
      change: "0 sold",
      positive: true,
    },
    {
      title: "Least Selling Products",
      value: "No sales yet",
      change: "0 sold",
      positive: false,
    },
  ],
  paymentMethodUsage: {
    paymentMethodData: [
      { label: "COD", value: 0, count: 0 },
      { label: "Khalti", value: 0, count: 0 },
      { label: "eSewa", value: 0, count: 0 },
    ],
    mostUsedMethod: "COD",
    mostUsedCount: 0,
  },
};

export async function safeJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();

  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

export function buildLinePath(
  values: number[],
  width: number,
  height: number,
  padding = 10
) {
  if (!values.length) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const allSame = max === min;
  const range = Math.max(max - min, 1);
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = allSame
        ? height / 2
        : padding + ((max - value) / range) * (height - padding * 2);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function isPositiveChange(value?: string) {
  return !String(value || "").trim().startsWith("-");
}

export function getRangeText(range: RangeKey) {
  if (range === "today") return "Today";
  if (range === "30days") return "Last 30 Days";
  return "Last 7 Days";
}

export function toInputDateValue(date: Date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().split("T")[0];
}

export function addMonthsSafe(dateString: string, months: number) {
  const d = new Date(dateString);
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return toInputDateValue(result);
}

export function getWidthClass(value: number) {
  const safe = Math.min(Math.max(Number(value || 0), 0), 100);

  if (safe <= 5) return "w-[5%]";
  if (safe <= 10) return "w-[10%]";
  if (safe <= 20) return "w-[20%]";
  if (safe <= 30) return "w-[30%]";
  if (safe <= 40) return "w-[40%]";
  if (safe <= 50) return "w-[50%]";
  if (safe <= 60) return "w-[60%]";
  if (safe <= 70) return "w-[70%]";
  if (safe <= 80) return "w-[80%]";
  if (safe <= 90) return "w-[90%]";
  return "w-full";
}

export function getHeightClass(value: number) {
  const safe = Math.min(Math.max(Number(value || 0), 0), 100);

  if (safe <= 4) return "h-[4%]";
  if (safe <= 10) return "h-[10%]";
  if (safe <= 20) return "h-[20%]";
  if (safe <= 30) return "h-[30%]";
  if (safe <= 40) return "h-[40%]";
  if (safe <= 50) return "h-[50%]";
  if (safe <= 60) return "h-[60%]";
  if (safe <= 70) return "h-[70%]";
  if (safe <= 80) return "h-[80%]";
  if (safe <= 90) return "h-[90%]";
  return "h-full";
}

export function normalizeAnalyticsData(
  data?: AnalyticsResponse["data"]
): NonNullable<AnalyticsResponse["data"]> {
  if (!data) return fallbackData;

  return {
    range: data.range || fallbackData.range,
    summaryCards: {
      ...fallbackData.summaryCards,
      ...(data.summaryCards || {}),
    },
    metrics:
      Array.isArray(data.metrics) && data.metrics.length
        ? data.metrics
        : fallbackData.metrics,
    salesTrendData:
      Array.isArray(data.salesTrendData) && data.salesTrendData.length
        ? data.salesTrendData.map((v) => Number(v || 0))
        : fallbackData.salesTrendData,
    salesTrendLabels:
      Array.isArray(data.salesTrendLabels) && data.salesTrendLabels.length
        ? data.salesTrendLabels
        : fallbackData.salesTrendLabels,
    revenueCategoryData: Array.isArray(data.revenueCategoryData)
      ? data.revenueCategoryData
      : [],
    customerBehaviorCards:
      Array.isArray(data.customerBehaviorCards) &&
      data.customerBehaviorCards.length
        ? data.customerBehaviorCards
        : fallbackData.customerBehaviorCards,
    customerAcquisitionData:
      Array.isArray(data.customerAcquisitionData) &&
      data.customerAcquisitionData.length
        ? data.customerAcquisitionData.map((v) => Number(v || 0))
        : fallbackData.customerAcquisitionData,
    customerAcquisitionLabels:
      Array.isArray(data.customerAcquisitionLabels) &&
      data.customerAcquisitionLabels.length
        ? data.customerAcquisitionLabels
        : fallbackData.customerAcquisitionLabels,
    productPerformanceCards:
      Array.isArray(data.productPerformanceCards) &&
      data.productPerformanceCards.length
        ? data.productPerformanceCards
        : fallbackData.productPerformanceCards,
    paymentMethodUsage: {
      mostUsedMethod:
        data.paymentMethodUsage?.mostUsedMethod ||
        fallbackData.paymentMethodUsage.mostUsedMethod,
      mostUsedCount:
        Number(data.paymentMethodUsage?.mostUsedCount || 0) ||
        fallbackData.paymentMethodUsage.mostUsedCount,
      paymentMethodData:
        Array.isArray(data.paymentMethodUsage?.paymentMethodData) &&
        data.paymentMethodUsage.paymentMethodData.length
          ? data.paymentMethodUsage.paymentMethodData
          : fallbackData.paymentMethodUsage.paymentMethodData,
    },
  };
}