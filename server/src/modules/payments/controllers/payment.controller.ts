import { Request, Response, NextFunction } from "express";
import { esewaService } from "../services/esewa.service";
import { khaltiService } from "../services/khalti.service";

export const paymentController = {
  // GET /api/payments/esewa/initiate?amount=5510
  esewaInitiate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amount = Number(req.query.amount);

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }

      const orderId = esewaService.makeOrderId("ESEWA");
      const redirectUrl = esewaService.createEsewaRedirectUrl({ amount, orderId });

      // ✅ Redirect user to eSewa payment page
      return res.redirect(redirectUrl);
    } catch (err) {
      next(err);
    }
  },

  // eSewa will redirect here
  esewaSuccess: async (_req: Request, res: Response) => {
    // Later verify transaction + update DB.
    // For now just redirect to ThankYou page.
    return res.redirect("http://localhost:3000/ThankYou");
  },

  esewaFailure: async (_req: Request, res: Response) => {
    return res.redirect("http://localhost:3000/payment?status=failed");
  },

  // POST /api/payments/khalti/initiate
  khaltiInitiate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, orderId, orderName } = req.body || {};

      const amt = Number(amount);
      if (!amt || Number.isNaN(amt) || amt <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }
      if (!orderId || !orderName) {
        return res.status(400).json({ success: false, message: "orderId and orderName required" });
      }

      const data = await khaltiService.initiatePayment({
        amount: amt,
        orderId,
        orderName,
      });

      // frontend expects: { payment_url }
      return res.status(200).json({
        success: true,
        payment_url: data?.payment_url,
        pidx: data?.pidx,
        raw: data,
      });
    } catch (err) {
      next(err);
    }
  },
};
