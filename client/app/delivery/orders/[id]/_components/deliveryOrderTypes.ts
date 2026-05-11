import {
  formatDateLong,
  safeStr,
} from "@/app/lib/delivery";

export type DeliveryTaskType =
  | "NORMAL_DELIVERY"
  | "RETURN_PICKUP"
  | "EXCHANGE_PICKUP"
  | "REPLACEMENT_DELIVERY";

export type TaskStatus =
  | "Assigned"
  | "Picked Up"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery"
  | "Returned"
  | "Returned to Store";

export type TimelineStep = {
  label: string;
  date: string;
  status: "done" | "current" | "upcoming";
};

export type ToastType = "success" | "error" | "info";

export type Toast = {
  type: ToastType;
  message: string;
};

export const panelClass =
  "rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const softPanelClass =
  "rounded-[22px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";

export const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClass =
  "w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6] focus:ring-4 focus:ring-[#8b5cf6]/10 disabled:cursor-not-allowed disabled:opacity-60";

export function getInitials(name?: string) {
  const safe = safeStr(name).trim();
  if (!safe) return "CU";

  const parts = safe.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return initials || "CU";
}

export function getColorDotClass(color?: string) {
  const c = safeStr(color).trim().toLowerCase();

  const colorMap: Record<string, string> = {
    black: "bg-black",
    "#000": "bg-black",
    "#000000": "bg-black",
    white: "bg-white",
    "#fff": "bg-white",
    "#ffffff": "bg-white",
    red: "bg-red-500",
    "#ef4444": "bg-red-500",
    blue: "bg-blue-500",
    "#3b82f6": "bg-blue-500",
    green: "bg-green-500",
    "#22c55e": "bg-green-500",
    yellow: "bg-yellow-400",
    "#eab308": "bg-yellow-400",
    gray: "bg-gray-500",
    grey: "bg-gray-500",
    "#808080": "bg-gray-500",
    pink: "bg-pink-500",
    "#ec4899": "bg-pink-500",
    purple: "bg-purple-500",
    "#a855f7": "bg-purple-500",
    orange: "bg-orange-500",
    "#f97316": "bg-orange-500",
    navy: "bg-blue-950",
    "navy blue": "bg-blue-950",
    "#000080": "bg-blue-950",
    brown: "bg-amber-900",
    maroon: "bg-red-900",
    cream: "bg-yellow-100",
    beige: "bg-stone-300",
  };

  return colorMap[c] || "bg-[#161824]";
}

export function getTaskLabel(taskType: DeliveryTaskType) {
  if (taskType === "RETURN_PICKUP") return "Return Pickup";
  if (taskType === "EXCHANGE_PICKUP") return "Exchange Pickup";
  if (taskType === "REPLACEMENT_DELIVERY") return "Replacement Delivery";
  return "Normal Delivery";
}

export function getTaskTone(taskType: DeliveryTaskType) {
  if (taskType === "RETURN_PICKUP") {
    return "border-orange-400/30 bg-orange-500/10 text-orange-200";
  }

  if (taskType === "EXCHANGE_PICKUP") {
    return "border-purple-400/30 bg-purple-500/10 text-purple-200";
  }

  if (taskType === "REPLACEMENT_DELIVERY") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }

  return "border-blue-400/30 bg-blue-500/10 text-blue-200";
}

export function normalizeTaskType(value?: string | null): DeliveryTaskType {
  const task = safeStr(value).toUpperCase();

  if (task === "RETURN_PICKUP") return "RETURN_PICKUP";
  if (task === "EXCHANGE_PICKUP") return "EXCHANGE_PICKUP";
  if (task === "REPLACEMENT_DELIVERY") return "REPLACEMENT_DELIVERY";

  return "NORMAL_DELIVERY";
}

export function getTaskAssignment(order: any, taskType: DeliveryTaskType) {
  if (taskType === "RETURN_PICKUP") {
    return order?.returnPickupAssignment || order?.taskAssignment || null;
  }

  if (taskType === "EXCHANGE_PICKUP") {
    return order?.exchangePickupAssignment || order?.taskAssignment || null;
  }

  if (taskType === "REPLACEMENT_DELIVERY") {
    return order?.replacementDeliveryAssignment || order?.taskAssignment || null;
  }

  return order?.deliveryAssignment || order?.taskAssignment || null;
}

export function getDefaultTaskFromOrder(order: any): DeliveryTaskType {
  const explicit = safeStr(order?.taskType || order?.taskAssignment?.taskType);

  if (explicit) return normalizeTaskType(explicit);

  if (order?.returnPickupAssignment?.deliveryManId) return "RETURN_PICKUP";
  if (order?.exchangePickupAssignment?.deliveryManId) return "EXCHANGE_PICKUP";
  if (order?.replacementDeliveryAssignment?.deliveryManId) {
    return "REPLACEMENT_DELIVERY";
  }

  return "NORMAL_DELIVERY";
}

export function getAllowedTransitions(
  currentStatus: string,
  taskType: DeliveryTaskType
): TaskStatus[] {
  const s = safeStr(currentStatus).toLowerCase();

  if (taskType === "RETURN_PICKUP" || taskType === "EXCHANGE_PICKUP") {
    if (!s || s === "assigned") {
      return ["Assigned", "Picked Up", "Failed Delivery"];
    }

    if (s === "picked up") {
      return ["Picked Up", "Returned to Store", "Failed Delivery"];
    }

    if (s === "returned to store") {
      return ["Returned to Store"];
    }

    if (s === "failed delivery") {
      return ["Failed Delivery"];
    }

    return ["Assigned", "Picked Up", "Returned to Store", "Failed Delivery"];
  }

  if (taskType === "REPLACEMENT_DELIVERY") {
    if (!s || s === "assigned") {
      return ["Assigned", "Picked Up", "Out for Delivery", "Failed Delivery"];
    }

    if (s === "picked up") {
      return ["Picked Up", "Out for Delivery", "Failed Delivery"];
    }

    if (s === "out for delivery") {
      return ["Out for Delivery", "Delivered", "Failed Delivery"];
    }

    if (s === "delivered") {
      return ["Delivered"];
    }

    if (s === "failed delivery") {
      return ["Failed Delivery"];
    }

    return ["Assigned", "Picked Up", "Out for Delivery", "Failed Delivery"];
  }

  if (!s || s === "assigned") {
    return ["Assigned", "Picked Up", "Failed Delivery", "Returned"];
  }

  if (s === "picked up") {
    return ["Picked Up", "Out for Delivery", "Failed Delivery", "Returned"];
  }

  if (s === "out for delivery") {
    return ["Out for Delivery", "Failed Delivery", "Returned"];
  }

  if (s === "delivered") {
    return ["Delivered"];
  }

  if (s === "failed delivery") {
    return ["Failed Delivery", "Returned"];
  }

  if (s === "returned") {
    return ["Returned"];
  }

  return ["Assigned", "Picked Up", "Failed Delivery", "Returned"];
}

export function buildTimeline(
  taskType: DeliveryTaskType,
  currentStatus: string,
  assignment: any,
  placedOn: string,
  assignedAt: string
): TimelineStep[] {
  if (taskType === "RETURN_PICKUP" || taskType === "EXCHANGE_PICKUP") {
    return [
      { label: "Task Created", date: placedOn, status: "done" },
      {
        label: "Assigned",
        date: assignedAt,
        status:
          currentStatus === "Assigned"
            ? "current"
            : assignedAt !== "-"
              ? "done"
              : "upcoming",
      },
      {
        label: "Picked Up",
        date: safeStr(assignment?.pickedUpAt)
          ? formatDateLong(assignment?.pickedUpAt)
          : "—",
        status:
          currentStatus === "Picked Up"
            ? "current"
            : ["Returned to Store", "Failed Delivery"].includes(currentStatus)
              ? "done"
              : "upcoming",
      },
      {
        label: "Returned to Store",
        date: safeStr(assignment?.returnedToStoreAt)
          ? formatDateLong(assignment?.returnedToStoreAt)
          : "—",
        status: currentStatus === "Returned to Store" ? "current" : "upcoming",
      },
    ];
  }

  if (taskType === "REPLACEMENT_DELIVERY") {
    return [
      { label: "Replacement Assigned", date: assignedAt, status: "done" },
      {
        label: "Picked Up",
        date: safeStr(assignment?.pickedUpAt)
          ? formatDateLong(assignment?.pickedUpAt)
          : "—",
        status:
          currentStatus === "Picked Up"
            ? "current"
            : ["Out for Delivery", "Delivered", "Failed Delivery"].includes(
                  currentStatus
                )
              ? "done"
              : "upcoming",
      },
      {
        label: "Out for Delivery",
        date: safeStr(assignment?.outForDeliveryAt)
          ? formatDateLong(assignment?.outForDeliveryAt)
          : "—",
        status:
          currentStatus === "Out for Delivery"
            ? "current"
            : ["Delivered", "Failed Delivery"].includes(currentStatus)
              ? "done"
              : "upcoming",
      },
      {
        label: "Delivered",
        date: safeStr(assignment?.deliveredAt)
          ? formatDateLong(assignment?.deliveredAt)
          : "—",
        status: currentStatus === "Delivered" ? "current" : "upcoming",
      },
    ];
  }

  return [
    { label: "Order Placed", date: placedOn, status: "done" },
    {
      label: "Assigned",
      date: assignedAt,
      status:
        currentStatus === "Assigned"
          ? "current"
          : assignedAt !== "-"
            ? "done"
            : "upcoming",
    },
    {
      label: "Picked Up",
      date: safeStr(assignment?.pickedUpAt)
        ? formatDateLong(assignment?.pickedUpAt)
        : "—",
      status:
        currentStatus === "Picked Up"
          ? "current"
          : ["Out for Delivery", "Delivered", "Failed Delivery", "Returned"].includes(
                currentStatus
              )
            ? "done"
            : "upcoming",
    },
    {
      label: "Out for Delivery",
      date: safeStr(assignment?.outForDeliveryAt)
        ? formatDateLong(assignment?.outForDeliveryAt)
        : "—",
      status:
        currentStatus === "Out for Delivery"
          ? "current"
          : ["Delivered", "Failed Delivery", "Returned"].includes(currentStatus)
            ? "done"
            : "upcoming",
    },
    {
      label: "Delivered",
      date: safeStr(assignment?.deliveredAt)
        ? formatDateLong(assignment?.deliveredAt)
        : "—",
      status: currentStatus === "Delivered" ? "current" : "upcoming",
    },
  ];
}