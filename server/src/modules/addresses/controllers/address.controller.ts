import { Request, Response } from "express";
import { addressService } from "../services/address.service";

type AuthReq = Request & { user?: { userId?: string } };

const setNoStore = (res: Response) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });
};

export const addressController = {
  // GET /api/addresses
  async listMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      setNoStore(res);
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    try {
      const data = await addressService.listMine(userId);
      setNoStore(res);
      return res.json({ success: true, ...data });
    } catch (e: any) {
      setNoStore(res);
      return res
        .status(500)
        .json({ success: false, message: e?.message || "Server error" });
    }
  },

  // POST /api/addresses
  async createMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      setNoStore(res);
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    try {
      const created = await addressService.createMine(userId, req.body);
      setNoStore(res);
      return res.status(201).json({ success: true, data: created });
    } catch (e: any) {
      setNoStore(res);
      return res
        .status(400)
        .json({ success: false, message: e?.message || "Bad request" });
    }
  },

  // PATCH /api/addresses/:id
  async updateMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      setNoStore(res);
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    try {
      const updated = await addressService.updateMine(
        userId,
        req.params.id,
        req.body
      );
      setNoStore(res);
      return res.json({ success: true, data: updated });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const status = msg === "Address not found" ? 404 : 400;
      setNoStore(res);
      return res.status(status).json({ success: false, message: msg });
    }
  },

  // DELETE /api/addresses/:id
  async deleteMine(req: AuthReq, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      setNoStore(res);
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    try {
      await addressService.deleteMine(userId, req.params.id);
      setNoStore(res);
      return res.json({ success: true });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const status = msg === "Address not found" ? 404 : 400;
      setNoStore(res);
      return res.status(status).json({ success: false, message: msg });
    }
  },

  // PATCH /api/addresses/:id/default
  async setDefault(req: AuthReq, res: Response) {
    const userId = req.user?.userId;

    if (!userId) {
      setNoStore(res);
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    try {
      const updated = await addressService.setDefault(userId, req.params.id);
      setNoStore(res);
      return res.json({ success: true, data: updated });
    } catch (e: any) {
      const msg = e?.message || "Bad request";
      const status = msg === "Address not found" ? 404 : 400;
      setNoStore(res);
      return res.status(status).json({ success: false, message: msg });
    }
  },
};