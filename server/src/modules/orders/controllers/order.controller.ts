import mongoose from "mongoose";
import fs from "fs";
import { Response } from "express";
import orderService from "../services/order.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { generateInvoicePdf } from "../../../services/invoice.service";
import { notificationService } from "../../notifications/services/notification.service";

function isAdminRole(role?: string) {
  const r = String(role || "").toLowerCase();
  return r === "admin" || r === "superadmin";
}

function buildAddressText(address: any) {
  if (!address) return "N/A";

  const parts = [
    address.addressLine,
    address.street,
    address.cityOrMunicipality,
    address.district,
    address.provinceId,
    address.country || "Nepal",
    address.postalCode,
  ].filter(Boolean);

  return parts.join(", ");
}

function resolveCustomerName(order: any, fallbackUserName?: string) {
  const a = order.address;
  if (a?.fullName?.trim()) return a.fullName.trim();

  const fn = [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();
  if (fn) return fn;

  return fallbackUserName || "Customer";
}

function norm(s: any) {
  return String(s || "").trim().toLowerCase();
}

function isPaidLike(s: any) {
  const v = norm(s);
  return ["paid", "success", "successful", "completed"].includes(v);
}

function statusLabel(statusLower: string) {
  if (statusLower === "pending") return "Order Pending";
  if (statusLower === "shipped") return "Order Shipped";
  if (statusLower === "delivered") return "Order Delivered";
  if (statusLower === "cancelled" || statusLower === "canceled") {
    return "Order Cancelled";
  }
  return "Order Updated";
}

function trackingLink(orderCode: string) {
  return `/order-tracking?code=${encodeURIComponent(orderCode)}`;
}

function orderDetailsLink(orderCode: string) {
  const clean = String(orderCode || "").replace(/^#/, "").trim();
  return clean ? `/customerorderdetails/${clean}` : "/profile/orders";
}

export const orderController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const data: any = await orderService.createOrder(userId, req.body);

      res.status(201).json({ data });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to create order",
      });
      return;
    }
  },

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { search = "", customerId, paymentStatus, orderStatus } = req.query;

      const data = await orderService.listOrders({
        search: String(search || ""),
        customerId: customerId ? String(customerId) : undefined,
        paymentStatus: paymentStatus ? String(paymentStatus) : undefined,
        orderStatus: orderStatus ? String(orderStatus) : undefined,
      });

      res.status(200).json({ data });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to fetch orders",
      });
      return;
    }
  },

  async getOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const data = await orderService.getOrderByIdOrCode(id);
      if (!data) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json({ data });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to fetch order",
      });
      return;
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentStatus, orderStatus } = req.body || {};

      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const existingOrder: any = isObjId
        ? await Order.findById(id).lean()
        : await Order.findOne({ orderCode: id }).lean();

      if (!existingOrder) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      const prevOrderStatus = norm(existingOrder.orderStatus);
      const nextOrderStatus = norm(orderStatus);

      const prevPaymentStatus = norm(existingOrder.paymentStatus);
      const nextPaymentStatus = norm(paymentStatus);

      const data = await orderService.updateOrder(id, {
        paymentStatus,
        orderStatus,
      });

      if (!data) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      const customerId = String(existingOrder.customer);
      const orderCode = String(existingOrder.orderCode || "");

      const safeNotifyCustomer = async (payload: {
        userId: string;
        title: string;
        message: string;
        type?:
          | "order"
          | "payment"
          | "stock"
          | "ticket"
          | "chat"
          | "promo"
          | "user"
          | "review"
          | "system";
        link?: string;
        meta?: Record<string, any>;
      }) => {
        try {
          await notificationService.createCustomer(payload);
        } catch (e: any) {
          console.log("Customer order notification failed (ignored):", e?.message);
        }
      };

      if (orderStatus && nextOrderStatus && nextOrderStatus !== prevOrderStatus) {
        if (nextOrderStatus === "shipped") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Shipped",
            message: `Good news! Your order ${orderCode} has been shipped.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (nextOrderStatus === "delivered") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Delivered",
            message: `Your order ${orderCode} has been delivered. Thank you for shopping with us!`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (
          nextOrderStatus === "cancelled" ||
          nextOrderStatus === "canceled"
        ) {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Cancelled",
            message: `Your order ${orderCode} has been cancelled.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (nextOrderStatus === "pending") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Pending",
            message: `Your order ${orderCode} is now pending.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else {
          await safeNotifyCustomer({
            userId: customerId,
            title: statusLabel(nextOrderStatus),
            message: `Your order ${orderCode} status was updated.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: existingOrder._id,
              orderCode,
              orderStatus,
            },
          });
        }
      }

      if (
        paymentStatus &&
        nextPaymentStatus &&
        nextPaymentStatus !== prevPaymentStatus
      ) {
        if (isPaidLike(nextPaymentStatus) && !isPaidLike(prevPaymentStatus)) {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Payment Successful",
            message: `Payment received for order ${orderCode}.`,
            type: "payment",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: existingOrder._id,
              orderCode,
              paymentStatus,
            },
          });
        } else if (nextPaymentStatus === "failed") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Payment Failed",
            message: `Payment failed for order ${orderCode}. Please try again.`,
            type: "payment",
            link: orderDetailsLink(orderCode),
            meta: {
              orderId: existingOrder._id,
              orderCode,
              paymentStatus,
            },
          });
        }
      }

      res.status(200).json({ data });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to update order",
      });
      return;
    }
  },

  async getMyOrderDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const order = await orderService.getMyOrderDetails(userId, id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json({ order });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to fetch order details",
      });
      return;
    }
  },

  async getMyOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid user" });
        return;
      }

      const orders = await Order.find({
        customer: new mongoose.Types.ObjectId(userId),
      })
        .select("orderCode createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const result = orders.map((o: any) => ({
        id: o.orderCode,
        date: new Date(o.createdAt).toISOString().split("T")[0],
      }));

      res.status(200).json({ orders: result });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to fetch order history",
      });
      return;
    }
  },

  async track(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const order = await orderService.trackOrder(code);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(200).json({ order });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to track order",
      });
      return;
    }
  },

  async downloadInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const order: any = isObjId
        ? await Order.findById(id).lean()
        : await Order.findOne({ orderCode: id }).lean();

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (!isAdminRole(role)) {
        if (String(order.customer) !== String(userId)) {
          res.status(403).json({ message: "Forbidden" });
          return;
        }
      }

      let customerEmail = order.address?.email || "";
      let customerPhone = order.address?.phone || "";

      let user: any = null;
      if (!customerEmail) {
        user = await User.findById(order.customer).select("email name").lean();
        customerEmail = user?.email || "";
      }

      const customerName = resolveCustomerName(order, user?.name);

      const invoiceNo =
        order.invoiceNo ||
        `INV-${new Date(order.createdAt).getFullYear()}-${String(
          order.orderCode
        ).replace("#", "")}`;

      const { filePath, fileName } = await generateInvoicePdf({
        invoiceNo,
        orderCode: order.orderCode,
        createdAt: order.createdAt,
        customer: {
          name: customerName,
          email: customerEmail || "N/A",
          phone: customerPhone || "N/A",
        },
        addressText: buildAddressText(order.address),
        items: (order.items || []).map((it: any) => ({
          name: it.colorLabel
            ? `${it.name} (${it.colorLabel}${it.size ? `, ${it.size}` : ""})`
            : it.name,
          size: it.size || "",
          qty: Number(it.qty || 0),
          pricePaisa: Number(it.pricePaisa || 0),
        })),
        subtotalPaisa: Number(order.subtotalPaisa || 0),
        discountPaisa: Number(order.discountPaisa || 0),
        shippingPaisa: Number(order.shippingPaisa || 0),
        totalPaisa: Number(order.totalPaisa || 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentRef: order.paymentRef || null,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      stream.on("close", () => {
        try {
          fs.existsSync(filePath) && fs.unlinkSync(filePath);
        } catch {}
      });

      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to download invoice",
      });
      return;
    }
  },
};