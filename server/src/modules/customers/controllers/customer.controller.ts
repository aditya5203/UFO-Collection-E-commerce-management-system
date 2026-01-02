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
      const data = await customerService.listCustomers(search);
      return res.json({ data });
    } catch {
      return res.status(500).json({ message: "Failed to fetch customers" });
    }
  },

  async getOne(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await customerService.getCustomerById(id);

      if (!data) return res.status(404).json({ message: "Customer not found" });

      return res.json({ data });
    } catch {
      return res.status(500).json({ message: "Failed to fetch customer" });
    }
  },

  // ✅ NEW: GET /api/admin/customers/:id/addresses
  async getAddresses(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // optional validation
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid customer id" });
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
