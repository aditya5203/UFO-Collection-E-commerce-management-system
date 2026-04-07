// server/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from "express";

// Generic validation middleware
export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!schema) {
      next();
      return;
    }

    const { error } = schema.validate
      ? schema.validate(req.body)
      : { error: null };

    if (error) {
      res.status(400).json({
        success: false,
        message: error.details?.[0]?.message || "Validation error",
      });
      return;
    }

    next();
  };
};