// server/src/modules/orders/controllers/order.controller.ts

import mongoose from "mongoose";
import { Response } from "express";
import orderService from "../services/order.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { Order } from "../../../models/Order.model";

export const orderController = {
  // =======================================================
  // CREATE ORDER (Customer)
  // =======================================================
  async create(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const data = await orderService.createOrder(userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to create order" });
    }
  },

  // =======================================================
  // LIST ORDERS (Admin)
  // =======================================================
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
      return res.status(500).json({ message: err?.message || "Failed to fetch orders" });
    }
  },

  // =======================================================
  // GET ONE ORDER (Admin)
  // =======================================================
  async getOne(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const data = await orderService.getOrderByIdOrCode(id);
      if (!data) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch order" });
    }
  },

  // =======================================================
  // UPDATE ORDER (Admin)
  // =======================================================
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { paymentStatus, orderStatus } = req.body || {};

      const data = await orderService.updateOrder(id, { paymentStatus, orderStatus });
      if (!data) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to update order" });
    }
  },

  // =======================================================
  // GET MY ORDER DETAILS (Customer)
  // GET /api/orders/my/:id
  // =======================================================
  async getMyOrderDetails(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;

      const order = await orderService.getMyOrderDetails(userId, id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ order });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch order details" });
    }
  },

  // =======================================================
  // ✅ GET MY ORDERS (Order History)
  // GET /api/orders/my
  // =======================================================
  async getMyOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user" });
      }

      const orders = await Order.find({ customer: new mongoose.Types.ObjectId(userId) })
        .select("orderCode createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const result = orders.map((o: any) => ({
        id: o.orderCode,
        date: new Date(o.createdAt).toISOString().split("T")[0],
      }));

      return res.status(200).json({ orders: result });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch order history" });
    }
  },

  // =======================================================
  // ✅ TRACK ORDER (Public)
  // GET /api/orders/track/:code
  // =======================================================
  async track(req: AuthRequest, res: Response) {
    try {
      const { code } = req.params;

      const order = await orderService.trackOrder(code);
      if (!order) return res.status(404).json({ message: "Order not found" });

      return res.status(200).json({ order });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to track order" });
    }
  },
};
