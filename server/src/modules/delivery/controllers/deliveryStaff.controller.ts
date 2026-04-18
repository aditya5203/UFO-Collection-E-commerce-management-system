import { Request, Response } from "express";
import { deliveryStaffService } from "../services/deliveryStaff.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";

export const deliveryStaffController = {
  async create(req: Request, res: Response) {
    try {
      const data = await deliveryStaffService.create(req.body);
      return res.status(201).json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to create delivery man",
      });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const search = String(req.query.search || "");
      const data = await deliveryStaffService.list(search);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 500).json({
        success: false,
        message: e?.message || "Failed to load delivery staff",
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const data = await deliveryStaffService.getById(req.params.id);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 404).json({
        success: false,
        message: e?.message || "Failed to load delivery staff",
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const data = await deliveryStaffService.update(req.params.id, req.body);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to update delivery staff",
      });
    }
  },

  async dashboard(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.user?.userId || "");
      const data = await deliveryStaffService.getDashboard(userId);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 500).json({
        success: false,
        message: e?.message || "Failed to load delivery dashboard",
      });
    }
  },

  async myOrders(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.user?.userId || "");
      const data = await deliveryStaffService.getMyOrders(userId);
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 500).json({
        success: false,
        message: e?.message || "Failed to load delivery orders",
      });
    }
  },

  async myOrderDetails(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.user?.userId || "");
      const data = await deliveryStaffService.getMyOrderDetails(
        userId,
        req.params.id
      );
      return res.json({ success: true, data });
    } catch (e: any) {
      return res.status(e?.statusCode || 404).json({
        success: false,
        message: e?.message || "Failed to load delivery order details",
      });
    }
  },

  async updateMyOrderStatus(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.user?.userId || "");
      const data = await deliveryStaffService.updateMyOrderStatus(
        userId,
        req.params.id,
        req.body
      );
      return res.json({
        success: true,
        message: "Delivery status updated successfully",
        data,
      });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to update delivery status",
      });
    }
  },
};