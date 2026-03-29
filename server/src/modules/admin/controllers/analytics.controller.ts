import { Request, Response, NextFunction } from "express";
import analyticsService from "../services/analytics.service";

export const analyticsController = {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const range = String(req.query.range || "7days") as "today" | "7days" | "30days";
      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;

      const data = await analyticsService.getAnalytics({
        range,
        from,
        to,
      });

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default analyticsController;