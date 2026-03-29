// server/src/modules/customers/controllers/customer.controller.ts
import { Response, Request } from "express";
import { customerService } from "../services/customer.service";
import type { AuthRequest } from "../../auth/middleware/auth.middleware";
import mongoose from "mongoose";
import { Address } from "../../../models/Address.model";

export const customerController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const search = String(req.query.search || "");
      const rawFilter = String(req.query.filter || "all");
      const filter =
        rawFilter === "blocked" || rawFilter === "deleted" ? rawFilter : "all";

      const data = await customerService.listCustomers(search, filter);
      return res.json({ success: true, data });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch customers" });
    }
  },

  async getOne(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await customerService.getCustomerById(id);

      if (!data) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      return res.json({ success: true, data });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to fetch customer" });
    }
  },

  async block(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await customerService.blockCustomer(id);

      if (!data) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      return res.json({
        success: true,
        message: "Customer blocked successfully",
        data,
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to block customer" });
    }
  },

  async unblock(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await customerService.unblockCustomer(id);

      if (!data) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      return res.json({
        success: true,
        message: "Customer unblocked successfully",
        data,
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to unblock customer" });
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await customerService.deleteCustomer(id);

      if (!data) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      return res.json({
        success: true,
        message: "Customer deleted successfully",
        data,
      });
    } catch {
      return res.status(500).json({ success: false, message: "Failed to delete customer" });
    }
  },

  async getAddresses(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid customer id" });
      }

      const items = await Address.find({ userId: id })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        shipping: items.filter((x: any) => x.type === "Shipping"),
        billing: items.filter((x: any) => x.type === "Billing"),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to load addresses",
      });
    }
  },
};