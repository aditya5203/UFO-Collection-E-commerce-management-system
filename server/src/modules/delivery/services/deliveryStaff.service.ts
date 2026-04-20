import mongoose from "mongoose";
import { User } from "../../../models/User.model";
import { Order } from "../../../models/Order.model";
import { AppError } from "../../../middleware/error.middleware";
import orderService from "../../orders/services/order.service";
import { getIO } from "../../../socket";
import { notificationService } from "../../notifications/services/notification.service";
import { emailService } from "../../../services/email.services";

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
      "Failed Delivery",
      "Returned",
    ],
    "Picked Up": [
      "Picked Up",
      "Out for Delivery",
      "Failed Delivery",
      "Returned",
    ],
    "Out for Delivery": [
      "Out for Delivery",
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

function customerOrderLink(orderCode: string) {
  const clean = String(orderCode || "").replace(/^#/, "").trim();
  return clean ? `/customerorderdetails/${clean}` : "/profile/orders";
}

function generateDeliveryOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function maskEmail(email: string) {
  const safe = String(email || "").trim();
  const [name, domain] = safe.split("@");
  if (!name || !domain) return safe;
  if (name.length <= 2) return `${name[0] || "*"}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string) {
  const safe = String(phone || "").trim();
  if (safe.length <= 4) return safe;
  return `${"*".repeat(Math.max(0, safe.length - 4))}${safe.slice(-4)}`;
}

async function emitOrderUpdated(updated: any, customerId: string) {
  try {
    const io = getIO();

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
}

async function notifyDeliveryStatus(
  updated: any,
  customerId: string,
  riderName: string,
  userId: string,
  nextStatus: string
) {
  const updatedOrderId = String(updated._id);
  const orderCode = String(updated.orderCode || "");

  try {
    if (nextStatus === "Picked Up") {
      await notificationService.createAdminForAll({
        title: "Order Picked Up",
        message: `${riderName} picked up order ${orderCode}.`,
        type: "order",
        link: `/admin/orders/${updatedOrderId}`,
        meta: {
          orderId: updatedOrderId,
          orderCode,
          deliveryStatus: nextStatus,
          deliveryManId: userId,
          deliveryManName: riderName,
          action: "delivery_picked_up",
        },
      });
    } else if (nextStatus === "Out for Delivery") {
      await notificationService.createAdminForAll({
        title: "Order Out for Delivery",
        message: `${riderName} marked order ${orderCode} as Out for Delivery.`,
        type: "order",
        link: `/admin/orders/${updatedOrderId}`,
        meta: {
          orderId: updatedOrderId,
          orderCode,
          deliveryStatus: nextStatus,
          deliveryManId: userId,
          deliveryManName: riderName,
          action: "delivery_out_for_delivery",
        },
      });
    } else if (nextStatus === "Delivered") {
      await notificationService.createAdminForAll({
        title: "Order Delivered",
        message: `${riderName} verified and completed delivery for order ${orderCode}.`,
        type: "order",
        link: `/admin/orders/${updatedOrderId}`,
        meta: {
          orderId: updatedOrderId,
          orderCode,
          deliveryStatus: nextStatus,
          deliveryManId: userId,
          deliveryManName: riderName,
          action: "delivery_delivered_verified",
        },
      });
    } else if (nextStatus === "Failed Delivery") {
      await notificationService.createAdminForAll({
        title: "Delivery Failed",
        message: `${riderName} marked delivery failed for order ${orderCode}.`,
        type: "order",
        link: `/admin/orders/${updatedOrderId}`,
        meta: {
          orderId: updatedOrderId,
          orderCode,
          deliveryStatus: nextStatus,
          deliveryManId: userId,
          deliveryManName: riderName,
          action: "delivery_failed",
        },
      });
    } else if (nextStatus === "Returned") {
      await notificationService.createAdminForAll({
        title: "Order Returned",
        message: `${riderName} marked order ${orderCode} as Returned.`,
        type: "order",
        link: `/admin/orders/${updatedOrderId}`,
        meta: {
          orderId: updatedOrderId,
          orderCode,
          deliveryStatus: nextStatus,
          deliveryManId: userId,
          deliveryManName: riderName,
          action: "delivery_returned",
        },
      });
    }
  } catch (e: any) {
    console.log("Admin delivery notification failed:", e?.message);
  }

  try {
    if (customerId) {
      if (nextStatus === "Picked Up") {
        await notificationService.createCustomer({
          userId: customerId,
          title: "Order Picked Up",
          message: `Your order ${orderCode} has been picked up by the delivery rider.`,
          type: "order",
          link: customerOrderLink(orderCode),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            source: "delivery",
            deliveryStatus: nextStatus,
          },
        });
      }

      if (nextStatus === "Out for Delivery") {
        await notificationService.createCustomer({
          userId: customerId,
          title: "Out for Delivery",
          message: `Your order ${orderCode} is out for delivery.`,
          type: "order",
          link: customerOrderLink(orderCode),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            source: "delivery",
            deliveryStatus: nextStatus,
          },
        });
      }

      if (nextStatus === "Delivered") {
        await notificationService.createCustomer({
          userId: customerId,
          title: "Order Delivered",
          message: `Your order ${orderCode} has been delivered successfully.`,
          type: "order",
          link: customerOrderLink(orderCode),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            source: "delivery",
            deliveryStatus: nextStatus,
          },
        });
      }

      if (nextStatus === "Failed Delivery") {
        await notificationService.createCustomer({
          userId: customerId,
          title: "Delivery Failed",
          message: `Delivery attempt failed for order ${orderCode}.`,
          type: "order",
          link: customerOrderLink(orderCode),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            source: "delivery",
            deliveryStatus: nextStatus,
          },
        });
      }

      if (nextStatus === "Returned") {
        await notificationService.createCustomer({
          userId: customerId,
          title: "Order Returned",
          message: `Your order ${orderCode} has been returned.`,
          type: "order",
          link: customerOrderLink(orderCode),
          meta: {
            orderId: updatedOrderId,
            orderCode,
            source: "delivery",
            deliveryStatus: nextStatus,
          },
        });
      }
    }
  } catch (e: any) {
    console.log("Customer delivery notification failed:", e?.message);
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

    if (nextStatus === "Delivered") {
      throw new AppError(
        "Delivered status requires OTP verification. Use verify OTP instead.",
        400
      );
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

      nextDeliveryAssignment.isOtpVerified = false;
      nextDeliveryAssignment.otpVerifiedAt = null;
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

    const updated = await Order.findByIdAndUpdate(order._id, update, {
      new: true,
    })
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new AppError("Failed to update delivery order", 500);
    }

    const customerId =
      String((updated as any)?.customer?._id || order.customer || "").trim();
    const riderName = String((rider as any)?.name || "Delivery rider").trim();

    await notifyDeliveryStatus(updated, customerId, riderName, userId, nextStatus);
    await emitOrderUpdated(updated, customerId);

    return orderService.mapOrder(updated);
  },

  async sendMyOrderOtp(userId: string, orderId: string, channel: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid delivery user id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError("Invalid order id", 400);
    }

    if (!["phone", "email"].includes(channel)) {
      throw new AppError("Channel must be either phone or email", 400);
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
    })
      .populate("customer", "name email phone")
      .lean();

    if (!order) {
      throw new AppError("Assigned order not found", 404);
    }

    const currentStatus = String(order?.deliveryAssignment?.status || "").trim();
    if (currentStatus !== "Out for Delivery") {
      throw new AppError(
        "OTP can only be sent when order status is Out for Delivery",
        400
      );
    }

    const targetPhone = String(
      order?.address?.phone || order?.customer?.phone || ""
    ).trim();

    const targetEmail = String(
      order?.address?.email || order?.customer?.email || ""
    ).trim();

    if (channel === "phone" && !targetPhone) {
      throw new AppError("Customer phone number not found", 400);
    }

    if (channel === "email" && !targetEmail) {
      throw new AppError("Customer email not found", 400);
    }

    const otpCode = generateDeliveryOtp();
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const nextDeliveryAssignment = {
      ...(order.deliveryAssignment || {}),
      otpCode,
      otpChannel: channel,
      otpSentTo: channel === "phone" ? targetPhone : targetEmail,
      otpExpiresAt,
      otpLastSentAt: now,
      otpVerifiedAt: null,
      isOtpVerified: false,
    };

    const updated: any = await Order.findByIdAndUpdate(
      order._id,
      {
        deliveryAssignment: nextDeliveryAssignment,
      },
      { new: true }
    )
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new AppError("Failed to save OTP", 500);
    }

    const orderCode = String(updated.orderCode || "");
    const customerName = String(
      updated?.address?.fullName || updated?.customer?.name || "Customer"
    ).trim();
    const maskedTarget =
      channel === "phone" ? maskPhone(targetPhone) : maskEmail(targetEmail);

    if (channel === "email") {
      await emailService.sendMail({
        to: targetEmail,
        subject: `Delivery OTP for Order ${orderCode}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
            <h2>Delivery Verification OTP</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Your delivery OTP for order <strong>${orderCode}</strong> is:</p>
            <div style="margin:18px 0;padding:14px 18px;background:#f4f4f5;border-radius:12px;font-size:28px;font-weight:700;letter-spacing:6px;">
              ${otpCode}
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>Please share it only with the delivery rider at the time of delivery.</p>
            <p>Thank you,<br/><strong>UFO Collection</strong></p>
          </div>
        `,
      });
    } else {
      console.log(
        `[DELIVERY OTP SMS SIMULATION] Order ${orderCode} | Phone: ${targetPhone} | OTP: ${otpCode}`
      );
    }

    try {
      const customerId = String(
        (updated as any)?.customer?._id || order.customer || ""
      ).trim();

      if (customerId) {
        await notificationService.createCustomer({
          userId: customerId,
          title: "Delivery OTP Sent",
          message:
            channel === "phone"
              ? `A delivery OTP was sent to your phone ending in ${targetPhone.slice(-4)}.`
              : `A delivery OTP was sent to your email ${maskedTarget}.`,
          type: "order",
          link: customerOrderLink(orderCode),
          meta: {
            orderId: String(updated._id),
            orderCode,
            source: "delivery",
            action: "delivery_otp_sent",
            otpChannel: channel,
          },
        });
      }
    } catch (e: any) {
      console.log("Customer OTP notification failed:", e?.message);
    }

    await emitOrderUpdated(updated, String((updated as any)?.customer?._id || ""));

    return {
      orderId: String(updated._id),
      orderCode,
      channel,
      sentTo: maskedTarget,
      expiresAt: otpExpiresAt,
      devOtpPreview: channel === "phone" ? otpCode : undefined,
    };
  },

  async verifyMyOrderOtp(userId: string, orderId: string, otp: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid delivery user id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError("Invalid order id", 400);
    }

    if (!otp) {
      throw new AppError("OTP is required", 400);
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
    })
      .populate("customer", "name email phone")
      .lean();

    if (!order) {
      throw new AppError("Assigned order not found", 404);
    }

    const currentAssignment = order.deliveryAssignment || {};
    const currentStatus = String(currentAssignment.status || "").trim();

    if (currentStatus !== "Out for Delivery") {
      throw new AppError(
        "OTP can only be verified when order status is Out for Delivery",
        400
      );
    }

    const savedOtp = String(currentAssignment.otpCode || "").trim();
    const otpExpiresAt = currentAssignment.otpExpiresAt
      ? new Date(currentAssignment.otpExpiresAt)
      : null;

    if (!savedOtp) {
      throw new AppError("No OTP has been sent for this order", 400);
    }

    if (!otpExpiresAt || otpExpiresAt.getTime() < Date.now()) {
      throw new AppError("OTP has expired. Please send a new OTP.", 400);
    }

    if (savedOtp !== String(otp).trim()) {
      throw new AppError("Invalid OTP", 400);
    }

    const now = new Date();

    const nextDeliveryAssignment = {
      ...currentAssignment,
      status: "Delivered",
      deliveredAt: currentAssignment.deliveredAt || now,
      outForDeliveryAt: currentAssignment.outForDeliveryAt || now,
      pickedUpAt: currentAssignment.pickedUpAt || now,
      otpVerifiedAt: now,
      isOtpVerified: true,
      otpCode: "",
    };

    const update: any = {
      deliveryAssignment: nextDeliveryAssignment,
      deliveredAt: order.deliveredAt || now,
      inTransitAt: order.inTransitAt || now,
      shippedAt: order.shippedAt || now,
      orderStatus: "Delivered",
      paymentStatus:
        String(order.paymentMethod || "").toUpperCase() === "COD"
          ? "Paid"
          : order.paymentStatus,
    };

    const updated = await Order.findByIdAndUpdate(order._id, update, {
      new: true,
    })
      .populate("customer", "name email phone")
      .lean();

    if (!updated) {
      throw new AppError("Failed to verify OTP and complete delivery", 500);
    }

    const customerId =
      String((updated as any)?.customer?._id || order.customer || "").trim();
    const riderName = String((rider as any)?.name || "Delivery rider").trim();

    await notifyDeliveryStatus(updated, customerId, riderName, userId, "Delivered");
    await emitOrderUpdated(updated, customerId);

    return orderService.mapOrder(updated);
  },
};