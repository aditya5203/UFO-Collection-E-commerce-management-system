import { Request, Response } from "express";
import { deliveryStaffService } from "../services/deliveryStaff.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";

export const deliveryStaffController = {
  async create(req: AuthRequest, res: Response) {
    try {
      const data = await deliveryStaffService.create(req.body, {
        userId: String(req.user?.userId || ""),
        name: String((req.user as any)?.name || ""),
      });

      return res.status(201).json({
        success: true,
        message: "Delivery invitation sent successfully",
        data,
      });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to send delivery invitation",
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

  async remove(req: AuthRequest, res: Response) {
    try {
      const currentUserId = String(req.user?.userId || "");
      const data = await deliveryStaffService.remove(req.params.id, currentUserId);

      return res.json({
        success: true,
        message: "Delivery staff permanently deleted successfully",
        data,
      });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to delete delivery staff",
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

  async sendMyOrderOtp(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.user?.userId || "");
      const channel = String(req.body?.channel || "").trim().toLowerCase();

      const data = await deliveryStaffService.sendMyOrderOtp(
        userId,
        req.params.id,
        channel
      );

      return res.json({
        success: true,
        message: "Delivery OTP sent successfully",
        data,
      });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to send delivery OTP",
      });
    }
  },

  async verifyMyOrderOtp(req: AuthRequest, res: Response) {
    try {
      const userId = String(req.user?.userId || "");
      const otp = String(req.body?.otp || "").trim();

      const data = await deliveryStaffService.verifyMyOrderOtp(
        userId,
        req.params.id,
        otp
      );

      return res.json({
        success: true,
        message: "Delivery OTP verified successfully",
        data,
      });
    } catch (e: any) {
      return res.status(e?.statusCode || 400).json({
        success: false,
        message: e?.message || "Failed to verify delivery OTP",
      });
    }
  },
};