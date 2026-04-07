// server/src/modules/admin/controllers/analytics.controller.ts
import { Request, Response, NextFunction } from "express";
import analyticsService from "../services/analytics.service";

export const analyticsController = {
  async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const range = String(req.query.range || "7days") as
        | "today"
        | "7days"
        | "30days";
      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;

      const data = await analyticsService.getAnalytics({
        range,
        from,
        to,
      });

      res.json({
        success: true,
        data,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
};

export default analyticsController;