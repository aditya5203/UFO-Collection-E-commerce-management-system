import mongoose from "mongoose";
import { User } from "../../../models/User.model";
import { Order } from "../../../models/Order.model";
import { AppError } from "../../../middleware/error.middleware";
import orderService from "../../orders/services/order.service";
import { getIO } from "../../../socket";

function mapDeliveryOrder(o: any) {
  return {
    id: String(o._id),
    orderCode: o.orderCode || "",
    totalPaisa: Number(o.totalPaisa || 0),
    total: Math.round(Number(o.totalPaisa || 0) / 100),
    paymentMethod: o.paymentMethod || "COD",
    paymentRef: o.paymentRef || null,
    orderStatus: o.orderStatus || "Pending",
    paymentStatus: o.paymentStatus || "Pending",
    createdAt: o.createdAt,
    customer: o.customer
      ? {
          id: String(o.customer._id),
          name: o.customer.name || "",
          email: o.customer.email || "",
          phone: o.customer.phone || "",
        }
      : { id: "", name: "", email: "", phone: "" },
    items: Array.isArray(o.items) ? o.items : [],
    address: o.address || null,
    shippingPaisa: Number(o.shippingPaisa || 0),
    discountPaisa: Number(o.discountPaisa || 0),
    shipping: o.shipping || null,
    deliveryAssignment: o.deliveryAssignment
      ? {
          ...o.deliveryAssignment,
          deliveryManId: o.deliveryAssignment.deliveryManId
            ? String(o.deliveryAssignment.deliveryManId)
            : "",
        }
      : null,
  };
}

function validateDeliveryStatusTransition(
  currentStatus: string,
  nextStatus: string
) {
  const current = String(currentStatus || "Assigned").trim();
  const next = String(nextStatus || "").trim();

  const allowedMap: Record<string, string[]> = {
    Assigned: [
      "Assigned",
      "Picked Up",
      "Out for Delivery",
      "Delivered",
      "Failed Delivery",
      "Returned",
    ],
    "Picked Up": [
      "Picked Up",
      "Out for Delivery",
      "Delivered",
      "Failed Delivery",
      "Returned",
    ],
    "Out for Delivery": [
      "Out for Delivery",
      "Delivered",
      "Failed Delivery",
      "Returned",
    ],
    Delivered: ["Delivered"],
    "Failed Delivery": ["Failed Delivery", "Returned"],
    Returned: ["Returned"],
  };

  const allowed = allowedMap[current] || [];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Invalid delivery status transition from "${current}" to "${next}"`,
      400
    );
  }
}

export const deliveryStaffService = {
  async create(data: any) {
    const email = String(data?.email || "").trim().toLowerCase();
    const name = String(data?.name || "").trim();
    const phone = String(data?.phone || "").trim();
    const password = String(data?.password || "").trim();
    const vehicleType = String(data?.vehicleType || "").trim();
    const vehicleNumber = String(data?.vehicleNumber || "").trim();
    const area = String(data?.area || "").trim();
    const isActive = Boolean(data?.isActive);

    if (!name) throw new AppError("Full name is required", 400);
    if (!email) throw new AppError("Email is required", 400);
    if (!phone) throw new AppError("Phone number is required", 400);
    if (!password) throw new AppError("Password is required", 400);
    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }
    if (!vehicleType) throw new AppError("Vehicle type is required", 400);
    if (!area) throw new AppError("Delivery area is required", 400);

    const exists = await User.findOne({ email });

    if (exists) {
      throw new AppError("User with this email already exists", 409);
    }

    const user = new User({
      name,
      email,
      phone,
      password,
      role: "delivery",
      status: isActive ? "active" : "inactive",
      mustChangePassword: true,
      provider: "credentials",
      vehicleType,
      vehicleNumber,
      deliveryArea: area,
      isBlocked: false,
      blockedAt: null,
      isDeleted: false,
      deletedAt: null,
      lastLogin: null,
    });

    await user.save();

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      vehicleType: user.vehicleType || "",
      vehicleNumber: user.vehicleNumber || "",
      area: user.deliveryArea || "",
      isActive: String(user.status || "").toLowerCase() === "active",
      mustChangePassword: !!user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async list(search: string) {
    const query: any = {
      role: "delivery",
    };

    const safeSearch = String(search || "").trim();
    if (safeSearch) {
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } },
        { deliveryArea: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select(
        "name email phone vehicleType vehicleNumber deliveryArea status mustChangePassword createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      users.map(async (u: any) => {
        const assigned = await Order.countDocuments({
          "deliveryAssignment.deliveryManId": u._id,
        });

        const delivered = await Order.countDocuments({
          "deliveryAssignment.deliveryManId": u._id,
          "deliveryAssignment.status": "Delivered",
        });

        const failed = await Order.countDocuments({
          "deliveryAssignment.deliveryManId": u._id,
          "deliveryAssignment.status": {
            $in: ["Failed Delivery", "Returned"],
          },
        });

        return {
          id: String(u._id),
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          vehicleType: u.vehicleType || "",
          vehicleNumber: u.vehicleNumber || "",
          area: u.deliveryArea || "",
          isActive: String(u.status || "").toLowerCase() === "active",
          mustChangePassword: !!u.mustChangePassword,
          assignedOrdersCount: assigned,
          deliveredOrdersCount: delivered,
          failedOrdersCount: failed,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      })
    );

    return enriched;
  },

  async getById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid delivery staff id", 400);
    }

    const user: any = await User.findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: "delivery",
    })
      .select(
        "name email phone vehicleType vehicleNumber deliveryArea status mustChangePassword createdAt updatedAt"
      )
      .lean();

    if (!user) throw new AppError("Delivery staff not found", 404);

    const assigned = await Order.countDocuments({
      "deliveryAssignment.deliveryManId": user._id,
    });

    const active = await Order.countDocuments({
      "deliveryAssignment.deliveryManId": user._id,
      "deliveryAssignment.status": {
        $in: ["Assigned", "Picked Up", "Out for Delivery"],
      },
    });

    const delivered = await Order.countDocuments({
      "deliveryAssignment.deliveryManId": user._id,
      "deliveryAssignment.status": "Delivered",
    });

    const failed = await Order.countDocuments({
      "deliveryAssignment.deliveryManId": user._id,
      "deliveryAssignment.status": "Failed Delivery",
    });

    const returned = await Order.countDocuments({
      "deliveryAssignment.deliveryManId": user._id,
      "deliveryAssignment.status": "Returned",
    });

    return {
      id: String(user._id),
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      vehicleType: user.vehicleType || "",
      vehicleNumber: user.vehicleNumber || "",
      area: user.deliveryArea || "",
      isActive: String(user.status || "").toLowerCase() === "active",
      mustChangePassword: !!user.mustChangePassword,
      assignedOrdersCount: assigned,
      activeOrdersCount: active,
      deliveredOrdersCount: delivered,
      failedOrdersCount: failed,
      returnedOrdersCount: returned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async update(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid delivery staff id", 400);
    }

    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(id),
      role: "delivery",
    }).select("+password");

    if (!user) {
      throw new AppError("Delivery staff not found", 404);
    }

    const email = String(data?.email ?? user.email).trim().toLowerCase();
    const name = String(data?.name ?? user.name).trim();
    const phone = String(data?.phone ?? user.phone ?? "").trim();
    const vehicleType = String(data?.vehicleType ?? user.vehicleType ?? "").trim();
    const vehicleNumber = String(
      data?.vehicleNumber ?? user.vehicleNumber ?? ""
    ).trim();
    const area = String(data?.area ?? user.deliveryArea ?? "").trim();

    if (!name) throw new AppError("Full name is required", 400);
    if (!email) throw new AppError("Email is required", 400);
    if (!phone) throw new AppError("Phone number is required", 400);
    if (!vehicleType) throw new AppError("Vehicle type is required", 400);
    if (!area) throw new AppError("Delivery area is required", 400);

    const existingEmail = await User.findOne({
      email,
      _id: { $ne: user._id },
    }).lean();

    if (existingEmail) {
      throw new AppError("Another user already uses this email", 409);
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    user.vehicleType = vehicleType;
    user.vehicleNumber = vehicleNumber;
    user.deliveryArea = area;
    user.status = data?.isActive ? "active" : "inactive";
    user.mustChangePassword = Boolean(data?.forcePasswordChange);

    await user.save();

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      vehicleType: user.vehicleType || "",
      vehicleNumber: user.vehicleNumber || "",
      area: user.deliveryArea || "",
      isActive: String(user.status || "").toLowerCase() === "active",
      mustChangePassword: !!user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async getDashboard(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid delivery user id", 400);
    }

    const rider = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      role: "delivery",
    }).lean();

    if (!rider) {
      throw new AppError("Delivery rider not found", 404);
    }

    const orders = await Order.find({
      "deliveryAssignment.deliveryManId": rider._id,
    })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const rows = (orders as any[]).map(mapDeliveryOrder);

    const assignedCount = rows.filter((item: any) => {
      const s = String(item?.deliveryAssignment?.status || "").toLowerCase();
      return s === "assigned" || s === "picked up";
    }).length;

    const outForDeliveryCount = rows.filter(
      (item: any) =>
        String(item?.deliveryAssignment?.status || "").toLowerCase() ===
        "out for delivery"
    ).length;

    const deliveredCount = rows.filter(
      (item: any) =>
        String(item?.deliveryAssignment?.status || "").toLowerCase() ===
        "delivered"
    ).length;

    const failedCount = rows.filter((item: any) => {
      const s = String(item?.deliveryAssignment?.status || "").toLowerCase();
      return s === "failed delivery" || s === "returned";
    }).length;

    return {
      summary: {
        assignedCount,
        outForDeliveryCount,
        deliveredCount,
        failedCount,
      },
      orders: rows,
    };
  },

  async getMyOrders(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid delivery user id", 400);
    }

    const rider = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      role: "delivery",
    }).lean();

    if (!rider) {
      throw new AppError("Delivery rider not found", 404);
    }

    const orders = await Order.find({
      "deliveryAssignment.deliveryManId": rider._id,
    })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return (orders as any[]).map(mapDeliveryOrder);
  },

  async getMyOrderDetails(userId: string, orderId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid delivery user id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError("Invalid order id", 400);
    }

    const rider = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      role: "delivery",
    }).lean();

    if (!rider) {
      throw new AppError("Delivery rider not found", 404);
    }

    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      "deliveryAssignment.deliveryManId": rider._id,
    })
      .populate("customer", "name email phone")
      .lean();

    if (!order) {
      throw new AppError("Assigned order not found", 404);
    }

    return orderService.mapOrder(order);
  },

  async updateMyOrderStatus(
    userId: string,
    orderId: string,
    input: {
      status?: string;
      note?: string;
    }
  ) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid delivery user id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError("Invalid order id", 400);
    }

    const rider = await User.findOne({
      _id: new mongoose.Types.ObjectId(userId),
      role: "delivery",
    }).lean();

    if (!rider) {
      throw new AppError("Delivery rider not found", 404);
    }

    const order: any = await Order.findOne({
      _id: new mongoose.Types.ObjectId(orderId),
      "deliveryAssignment.deliveryManId": rider._id,
    }).lean();

    if (!order) {
      throw new AppError("Assigned order not found", 404);
    }

    const currentAssignment = order.deliveryAssignment || {};
    const currentStatus = String(currentAssignment.status || "Assigned");
    const nextStatus = String(input?.status || "").trim();
    const note = typeof input?.note === "string" ? input.note.trim() : undefined;

    if (!nextStatus) {
      throw new AppError("Delivery status is required", 400);
    }

    validateDeliveryStatusTransition(currentStatus, nextStatus);

    const nextDeliveryAssignment = {
      ...currentAssignment,
      status: nextStatus,
      note: note !== undefined ? note : currentAssignment.note || "",
    };

    const now = new Date();

    if (nextStatus === "Picked Up" && !nextDeliveryAssignment.pickedUpAt) {
      nextDeliveryAssignment.pickedUpAt = now;
    }

    if (
      nextStatus === "Out for Delivery" &&
      !nextDeliveryAssignment.outForDeliveryAt
    ) {
      nextDeliveryAssignment.outForDeliveryAt = now;
      if (!nextDeliveryAssignment.pickedUpAt) {
        nextDeliveryAssignment.pickedUpAt = now;
      }
    }

    if (nextStatus === "Delivered" && !nextDeliveryAssignment.deliveredAt) {
      nextDeliveryAssignment.deliveredAt = now;
      if (!nextDeliveryAssignment.outForDeliveryAt) {
        nextDeliveryAssignment.outForDeliveryAt = now;
      }
      if (!nextDeliveryAssignment.pickedUpAt) {
        nextDeliveryAssignment.pickedUpAt = now;
      }
    }

    if (nextStatus === "Failed Delivery" && !nextDeliveryAssignment.failedAt) {
      nextDeliveryAssignment.failedAt = now;
    }

    if (nextStatus === "Returned" && !nextDeliveryAssignment.returnedAt) {
      nextDeliveryAssignment.returnedAt = now;
    }

    const update: any = {
      deliveryAssignment: nextDeliveryAssignment,
    };

    if (nextStatus === "Out for Delivery" && !order.inTransitAt) {
      update.inTransitAt = now;
      if (!order.shippedAt) update.shippedAt = now;
      update.orderStatus = "Transit";
    }

    if (nextStatus === "Delivered" && !order.deliveredAt) {
      update.deliveredAt = now;
      if (!order.shippedAt) update.shippedAt = now;
      if (!order.inTransitAt) update.inTransitAt = now;
      update.orderStatus = "Delivered";
      update.paymentStatus =
        String(order.paymentMethod || "").toUpperCase() === "COD"
          ? "Paid"
          : order.paymentStatus;
    }

    const updated = await Order.findByIdAndUpdate(order._id, update, {
      new: true,
    })
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new AppError("Failed to update delivery order", 500);
    }

    try {
      const io = getIO();

      const customerId =
        String((updated as any)?.customer?._id || order.customer || "").trim();

      const payload = {
        orderId: String(updated._id),
        orderCode: String(updated.orderCode || ""),
        orderStatus: String(updated.orderStatus || ""),
        paymentStatus: String(updated.paymentStatus || ""),
        deliveryAssignment: updated.deliveryAssignment
          ? {
              ...updated.deliveryAssignment,
              deliveryManId: updated.deliveryAssignment.deliveryManId
                ? String(updated.deliveryAssignment.deliveryManId)
                : "",
            }
          : null,
        updatedAt: new Date().toISOString(),
        source: "delivery",
      };

      io.to("admins").emit("order:updated", payload);
      io.to(`admin:order:${String(updated._id)}`).emit("order:updated", payload);

      if (customerId) {
        io.to(`user:${customerId}`).emit("order:updated", payload);
      }
    } catch (e: any) {
      console.log("Socket emit failed (ignored):", e?.message);
    }

    return orderService.mapOrder(updated);
  },
};