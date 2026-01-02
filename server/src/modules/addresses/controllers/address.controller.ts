//server/src/modules/addresses/controllers/address.controller.ts
import { Request, Response } from "express";
import { addressService } from "../services/address.service";

type AuthReq = Request & { user?: { userId?: string } };

export const addressController = {
  // GET /api/addresses
  async listMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      const data = await addressService.listMine(userId);
      return res.json({ success: true, ...data });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e?.message || "Server error" });
    }
  },

  // POST /api/addresses
  async createMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      const created = await addressService.createMine(userId, req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e?.message || "Bad request" });
    }
  },

  // PATCH /api/addresses/:id
  async updateMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      const updated = await addressService.updateMine(userId, req.params.id, req.body);
      return res.json({ success: true, data: updated });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const status = msg === "Address not found" ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  },

  // DELETE /api/addresses/:id
  async deleteMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      await addressService.deleteMine(userId, req.params.id);
      return res.json({ success: true });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const status = msg === "Address not found" ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  },

  // PATCH /api/addresses/:id/default
  async setDefault(req: AuthReq, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      const updated = await addressService.setDefault(userId, req.params.id);
      return res.json({ success: true, data: updated });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const status = msg === "Address not found" ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  },
};
