// server/src/modules/admin/controllers/dashboard.controller.ts
import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  async getSummary(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await dashboardService.getSummary();

      res.status(200).json({
        success: true,
        data,
      });
      return;
    } catch (e) {
      next(e);
      return;
    }
  },
};