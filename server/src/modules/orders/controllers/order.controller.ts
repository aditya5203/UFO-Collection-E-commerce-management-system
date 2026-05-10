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
  if (statusLower === "confirmed") return "Order Confirmed";
  if (statusLower === "processing") return "Order Processing";
  if (statusLower === "shipped") return "Order Shipped";
  if (statusLower === "transit") return "Order In Transit";
  if (statusLower === "delivered") return "Order Delivered";
  if (statusLower === "returned") return "Order Returned";
  if (statusLower === "refunded") return "Order Refunded";
  if (statusLower === "cancelled" || statusLower === "canceled") {
    return "Order Cancelled";
  }
  return "Order Updated";
}

function orderDetailsLink(orderCode: string) {
  const clean = String(orderCode || "").replace(/^#/, "").trim();
  return clean ? `/customerorderdetails/${clean}` : "/profile/orders";
}

function getAuthUserId(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return "";
  }
  return userId;
}

export const orderController = {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = getAuthUserId(req, res);
      if (!userId) return;

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
      res.status(400).json({
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
      const { paymentStatus, orderStatus, deliveryAssignment } = req.body || {};

      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const existingOrder: any = isObjId
        ? await Order.findById(id).lean()
        : await Order.findOne({
            orderCode: String(id || "").startsWith("#")
              ? String(id || "")
              : `#${String(id || "")}`,
          }).lean();

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
        deliveryAssignment,
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
          console.log(
            "Customer order notification failed (ignored):",
            e?.message
          );
        }
      };

      if (orderStatus && nextOrderStatus && nextOrderStatus !== prevOrderStatus) {
        if (nextOrderStatus === "confirmed") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Confirmed",
            message: `Your order ${orderCode} has been confirmed.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (nextOrderStatus === "processing") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Processing",
            message: `Your order ${orderCode} is now being processed.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (nextOrderStatus === "shipped") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Shipped",
            message: `Good news! Your order ${orderCode} has been shipped.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (nextOrderStatus === "transit") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order In Transit",
            message: `Your order ${orderCode} is now in transit.`,
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
        } else if (nextOrderStatus === "returned") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Returned",
            message: `Your order ${orderCode} has been marked as returned.`,
            type: "order",
            link: orderDetailsLink(orderCode),
            meta: { orderId: existingOrder._id, orderCode },
          });
        } else if (nextOrderStatus === "refunded") {
          await safeNotifyCustomer({
            userId: customerId,
            title: "Order Refunded",
            message: `Your order ${orderCode} has been marked as refunded.`,
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
      const userId = getAuthUserId(req, res);
      if (!userId) return;

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
      const userId = getAuthUserId(req, res);
      if (!userId) return;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid user" });
        return;
      }

      const orders = await orderService.getMyOrdersSummary(userId);

      res.status(200).json({ orders });
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

  async requestCancellation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = getAuthUserId(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { reason } = req.body || {};

      const order = await orderService.requestCancellation({
        userId,
        idOrCode: id,
        reason: String(reason || ""),
      });

      res.status(200).json({
        message: "Cancellation request submitted successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to submit cancellation request",
      });
      return;
    }
  },

  async requestReturn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = getAuthUserId(req, res);
      if (!userId) return;

      const { id } = req.params;
      const { reason, type, preferredResolution, images } = req.body || {};

      const order = await orderService.requestReturn({
        userId,
        idOrCode: id,
        reason: String(reason || ""),
        type,
        preferredResolution,
        images: Array.isArray(images) ? images : [],
      });

      res.status(200).json({
        message: "Return/exchange request submitted successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to submit return/exchange request",
      });
      return;
    }
  },

  async listReturnsRefunds(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { type = "", status = "", search = "" } = req.query;

      const requests = await orderService.listReturnsRefunds({
        type: String(type || ""),
        status: String(status || ""),
        search: String(search || ""),
      });

      res.status(200).json({ requests });
      return;
    } catch (err: any) {
      res.status(500).json({
        message: err?.message || "Failed to fetch return/refund requests",
      });
      return;
    }
  },

  async approveCancellation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.approveCancellation({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Cancellation request approved successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to approve cancellation request",
      });
      return;
    }
  },

  async rejectCancellation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.rejectCancellation({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Cancellation request rejected successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to reject cancellation request",
      });
      return;
    }
  },

  async approveReturn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.approveReturn({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Return/exchange request approved successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to approve return/exchange request",
      });
      return;
    }
  },

  async rejectReturn(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.rejectReturn({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Return/exchange request rejected successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to reject return/exchange request",
      });
      return;
    }
  },

  async assignReturnPickup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { deliveryManId, note } = req.body || {};

      const order = await orderService.assignReturnPickup({
        adminId,
        idOrCode: id,
        deliveryManId: String(deliveryManId || ""),
        note: String(note || ""),
      });

      res.status(200).json({
        message: "Return pickup rider assigned successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to assign return pickup rider",
      });
      return;
    }
  },

  async assignExchangePickup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { deliveryManId, note } = req.body || {};

      const order = await orderService.assignExchangePickup({
        adminId,
        idOrCode: id,
        deliveryManId: String(deliveryManId || ""),
        note: String(note || ""),
      });

      res.status(200).json({
        message: "Exchange pickup rider assigned successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to assign exchange pickup rider",
      });
      return;
    }
  },

  async updateReturnOrExchangePickupByDelivery(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const deliveryManId = getAuthUserId(req, res);
      if (!deliveryManId) return;

      const { id } = req.params;
      const { taskType, status, note, photo } = req.body || {};

      const order = await orderService.updateReturnOrExchangePickupByDelivery({
        deliveryManId,
        idOrCode: id,
        taskType,
        status,
        note: String(note || ""),
        photo: String(photo || ""),
      });

      res.status(200).json({
        message: "Pickup status updated successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to update pickup status",
      });
      return;
    }
  },

  async markProductReceived(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.markProductReceived({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Returned product marked as received successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to mark product as received",
      });
      return;
    }
  },

  async requestRefundDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.requestRefundDetails({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Refund details requested successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to request refund details",
      });
      return;
    }
  },

  async submitRefundDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = getAuthUserId(req, res);
      if (!userId) return;

      const { id } = req.params;
      const {
        method,
        accountName,
        accountNumber,
        bankName,
        walletNumber,
        walletId,
        customerNote,
      } = req.body || {};

      const order = await orderService.submitRefundDetails({
        userId,
        idOrCode: id,
        method,
        accountName: String(accountName || ""),
        accountNumber: String(accountNumber || ""),
        bankName: String(bankName || ""),
        walletNumber: String(walletNumber || ""),
        walletId: String(walletId || ""),
        customerNote: String(customerNote || ""),
      });

      res.status(200).json({
        message: "Refund details submitted successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to submit refund details",
      });
      return;
    }
  },

  async markRefundProcessing(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.markRefundProcessing({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Refund marked as processing successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to mark refund as processing",
      });
      return;
    }
  },

  async markRefunded(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote, transactionRef } = req.body || {};

      const order = await orderService.markRefunded({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
        transactionRef: String(transactionRef || ""),
      });

      res.status(200).json({
        message: "Refund marked as completed successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to mark refund as completed",
      });
      return;
    }
  },

  async assignReplacementDelivery(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { deliveryManId, note } = req.body || {};

      const order = await orderService.assignReplacementDelivery({
        adminId,
        idOrCode: id,
        deliveryManId: String(deliveryManId || ""),
        note: String(note || ""),
      });

      res.status(200).json({
        message: "Replacement delivery rider assigned successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to assign replacement delivery rider",
      });
      return;
    }
  },

  async updateReplacementDeliveryByDelivery(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const deliveryManId = getAuthUserId(req, res);
      if (!deliveryManId) return;

      const { id } = req.params;
      const { status, note, photo } = req.body || {};

      const order = await orderService.updateReplacementDeliveryByDelivery({
        deliveryManId,
        idOrCode: id,
        taskType: "REPLACEMENT_DELIVERY",
        status,
        note: String(note || ""),
        photo: String(photo || ""),
      });

      res.status(200).json({
        message: "Replacement delivery status updated successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message:
          err?.message || "Failed to update replacement delivery status",
      });
      return;
    }
  },

  async completeExchange(req: AuthRequest, res: Response): Promise<void> {
    try {
      const adminId = getAuthUserId(req, res);
      if (!adminId) return;

      const { id } = req.params;
      const { adminNote } = req.body || {};

      const order = await orderService.completeExchange({
        adminId,
        idOrCode: id,
        adminNote: String(adminNote || ""),
      });

      res.status(200).json({
        message: "Exchange completed successfully.",
        order,
      });
      return;
    } catch (err: any) {
      res.status(400).json({
        message: err?.message || "Failed to complete exchange",
      });
      return;
    }
  },

  async downloadInvoice(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = getAuthUserId(req, res);
      if (!userId) return;

      const role = req.user?.role;
      const { id } = req.params;

      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const normalizedCode = String(id || "").startsWith("#")
        ? String(id || "")
        : `#${String(id || "")}`;

      const order: any = isObjId
        ? await Order.findById(id).lean()
        : await Order.findOne({ orderCode: normalizedCode }).lean();

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
          name: it.name || "",
          size: it.size || "",
          color: it.color || "",
          colorLabel: it.colorLabel || "",
          sku: it.sku || "",
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

export default orderController;