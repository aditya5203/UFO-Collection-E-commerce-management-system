// server/src/modules/payments/controllers/payment.controller.ts

import { Request, Response, NextFunction } from "express";
import { esewaService } from "../services/esewa.service";
import { khaltiService } from "../services/khalti.service";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";

export const paymentController = {
  // ======================================================
  // eSewa INITIATE (HTML auto-submit)
  // ======================================================
  esewaInitiate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amount = Number(req.query.amount);

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid amount" });
      }

      const transactionUuid = esewaService.makeOrderId("ESEWA");

      const { formUrl, fields } = esewaService.createEsewaV2Form({
        totalAmount: amount,
        transactionUuid,
      });

      const html = esewaService.buildAutoSubmitHtml(formUrl, fields);
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(html);
    } catch (err) {
      next(err);
    }
  },

  // ======================================================
  // eSewa INITIATE (JSON – Swagger/debug)
  // ======================================================
  esewaInitiateJson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const amount = Number(req.query.amount);

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid amount" });
      }

      const transactionUuid = esewaService.makeOrderId("ESEWA");

      const { formUrl, fields } = esewaService.createEsewaV2Form({
        totalAmount: amount,
        transactionUuid,
      });

      return res.status(200).json({
        success: true,
        formUrl,
        fields,
        note:
          "Use /esewa/initiate in browser for real redirect. This endpoint is for Swagger/debug only.",
      });
    } catch (err) {
      next(err);
    }
  },

  // ======================================================
  // eSewa SUCCESS CALLBACK (gateway → backend → frontend)
  // ======================================================
  esewaSuccess: async (req: Request, res: Response) => {
    const data = String(req.query.data || "");

    if (!data) {
      return res.redirect(`${FRONTEND_BASE}/payment?status=failed`);
    }

    // Send data back to frontend so it can verify + create order
    return res.redirect(
      `${FRONTEND_BASE}/payment?esewa=success&data=${encodeURIComponent(data)}`
    );
  },

  // ======================================================
  // eSewa FAILURE CALLBACK
  // ======================================================
  esewaFailure: async (_req: Request, res: Response) => {
    return res.redirect(`${FRONTEND_BASE}/payment?status=failed`);
  },

  // ======================================================
  // eSewa VERIFY (frontend → backend)
  // ======================================================
  esewaVerify: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = String(req.body?.data || "").trim();

      if (!data) {
        return res
          .status(400)
          .json({ success: false, message: "data is required" });
      }

      // decode payload
      const payload = esewaService.decodeEsewaData(data);

      // verify signature (most important)
      const signatureOk = esewaService.verifyEsewaResponseSignature(payload);
      if (!signatureOk) {
        return res.status(400).json({
          success: false,
          message: "Invalid eSewa signature",
          payload,
        });
      }

      // parse transaction & amount safely
      const transaction_uuid = String(payload?.transaction_uuid || "").trim();
      const rawAmount = String(payload?.total_amount || "").trim();
      const total_amount = Number(rawAmount.replace(/,/g, ""));

      // if missing fields -> still allow frontend to continue
      if (!transaction_uuid || !total_amount || Number.isNaN(total_amount)) {
        return res.status(200).json({
          success: true,
          signatureOk: true,
          statusOk: false,
          transaction_uuid: transaction_uuid || null,
          total_amount: rawAmount || null,
          message: "Signature OK but missing/invalid amount or transaction ID",
          payload,
        });
      }

      // optional status check (do not hard fail)
      let statusOk = true;
      try {
        await esewaService.checkStatus({
          transaction_uuid,
          total_amount,
        });
      } catch {
        statusOk = false;
      }

      return res.status(200).json({
        success: true,
        signatureOk: true,
        statusOk,
        transaction_uuid,
        total_amount,
        payload,
        ...(statusOk
          ? {}
          : {
              message:
                "Signature OK, but status check failed (treat as Pending)",
            }),
      });
    } catch (err) {
      next(err);
    }
  },

  // ======================================================
  // Khalti INITIATE
  // ======================================================
  khaltiInitiate: async (req: Request, res: Response) => {
    try {
      const { amount, orderId, orderName } = req.body || {};
      const amt = Number(amount);

      if (!amt || Number.isNaN(amt) || amt <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid amount" });
      }

      if (!orderId || !orderName) {
        return res.status(400).json({
          success: false,
          message: "orderId and orderName required",
        });
      }

      const data = await khaltiService.initiatePayment({
        amount: amt,
        orderId,
        orderName,
      });

      return res.status(200).json({
        success: true,
        payment_url: data?.payment_url,
        pidx: data?.pidx,
        raw: data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || "Khalti initiate failed",
      });
    }
  },

  // ======================================================
  // Khalti LOOKUP / VERIFY
  // ======================================================
  khaltiLookup: async (req: Request, res: Response) => {
    try {
      const { pidx } = req.body || {};

      if (!pidx) {
        return res
          .status(400)
          .json({ success: false, message: "pidx is required" });
      }

      const data = await khaltiService.lookupPayment({ pidx });

      const status = String(data?.status || "");
      const paid = status.toLowerCase() === "completed";

      return res.status(200).json({
        success: true,
        paid,
        status,
        transaction_id: data?.transaction_id || data?.txnId || null,
        amount: data?.total_amount ?? data?.amount ?? null,
        raw: data,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err?.message || "Khalti lookup failed",
      });
    }
  },
};
