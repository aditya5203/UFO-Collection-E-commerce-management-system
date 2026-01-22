import mongoose from "mongoose";
import fs from "fs";
import { Response } from "express";
import orderService from "../services/order.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { Order } from "../../../models/Order.model";
import { User } from "../../../models/User.model";
import { generateInvoicePdf } from "../../../services/invoice.service";

/* -------------------------------------------------------
 * Helpers
 * -----------------------------------------------------*/
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

/* -------------------------------------------------------
 * Controller
 * -----------------------------------------------------*/
export const orderController = {
  // =====================================================
  // CREATE ORDER (Customer)
  // =====================================================
  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = await orderService.createOrder(userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to create order" });
    }
  },

  // =====================================================
  // LIST ORDERS (Admin)
  // =====================================================
  async list(req: AuthRequest, res: Response) {
    try {
      const { search = "", customerId, paymentStatus, orderStatus } = req.query;

      const data = await orderService.listOrders({
        search: String(search || ""),
        customerId: customerId ? String(customerId) : undefined,
        paymentStatus: paymentStatus ? String(paymentStatus) : undefined,
        orderStatus: orderStatus ? String(orderStatus) : undefined,
      });

      return res.status(200).json({ data });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to fetch orders" });
    }
  },

  // =====================================================
  // GET ONE ORDER (Admin)
  // =====================================================
  async getOne(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const data = await orderService.getOrderByIdOrCode(id);
      if (!data) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ data });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to fetch order" });
    }
  },

  // =====================================================
  // UPDATE ORDER (Admin)
  // =====================================================
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { paymentStatus, orderStatus } = req.body || {};

      const data = await orderService.updateOrder(id, {
        paymentStatus,
        orderStatus,
      });

      if (!data) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ data });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to update order" });
    }
  },

  // =====================================================
  // GET MY ORDER DETAILS (Customer)
  // =====================================================
  async getMyOrderDetails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;

      const order = await orderService.getMyOrderDetails(userId, id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ order });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to fetch order details" });
    }
  },

  // =====================================================
  // GET MY ORDERS (Customer)
  // =====================================================
  async getMyOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user" });
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

      return res.status(200).json({ orders: result });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to fetch order history" });
    }
  },

  // =====================================================
  // TRACK ORDER (Public)
  // =====================================================
  async track(req: AuthRequest, res: Response) {
    try {
      const { code } = req.params;

      const order = await orderService.trackOrder(code);
      if (!order) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ order });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to track order" });
    }
  },

  // =====================================================
  // DOWNLOAD INVOICE PDF (Admin OR Customer)
  // GET /api/orders/:id/invoice
  // =====================================================
  async downloadInvoice(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;

      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const order: any = isObjId
        ? await Order.findById(id).lean()
        : await Order.findOne({ orderCode: id }).lean();

      if (!order) return res.status(404).json({ message: "Order not found" });

      // 🔒 Ownership check
      if (!isAdminRole(role)) {
        if (String(order.customer) !== String(userId)) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      // Customer info
      let customerEmail = order.address?.email || "";
      let customerPhone = order.address?.phone || "";

      let user: any = null;
      if (!customerEmail) {
        user = await User.findById(order.customer)
          .select("email name")
          .lean();
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
          name: it.name,
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
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      stream.on("close", () => {
        try {
          fs.existsSync(filePath) && fs.unlinkSync(filePath);
        } catch {}
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message || "Failed to download invoice" });
    }
  },
};
