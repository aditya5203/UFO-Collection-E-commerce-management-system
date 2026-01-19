import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getSummary();
      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },
};
