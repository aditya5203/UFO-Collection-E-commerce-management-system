// server/src/modules/payments/controllers/payment.controller.ts

import { Request, Response, NextFunction } from "express";
import { esewaService } from "../services/esewa.service";
import { khaltiService } from "../services/khalti.service";

const FRONTEND_BASE = process.env.FRONTEND_URL || "http://localhost:3000";

export const paymentController = {
  // ======================================================
  // eSewa INITIATE (HTML auto-submit)
  // ======================================================
  esewaInitiate: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const amount = Number(req.query.amount);

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
        return;
      }

      const transactionUuid = esewaService.makeOrderId("ESEWA");

      const { formUrl, fields } = esewaService.createEsewaV2Form({
        totalAmount: amount,
        transactionUuid,
      });

      const html = esewaService.buildAutoSubmitHtml(formUrl, fields);
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(html);
      return;
    } catch (err) {
      next(err);
      return;
    }
  },

  // ======================================================
  // eSewa INITIATE (JSON – Swagger/debug)
  // ======================================================
  esewaInitiateJson: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const amount = Number(req.query.amount);

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
        return;
      }

      const transactionUuid = esewaService.makeOrderId("ESEWA");

      const { formUrl, fields } = esewaService.createEsewaV2Form({
        totalAmount: amount,
        transactionUuid,
      });

      res.status(200).json({
        success: true,
        formUrl,
        fields,
        note:
          "Use /esewa/initiate in browser for real redirect. This endpoint is for Swagger/debug only.",
      });
      return;
    } catch (err) {
      next(err);
      return;
    }
  },

  // ======================================================
  // eSewa SUCCESS CALLBACK (gateway → backend → frontend)
  // ======================================================
  esewaSuccess: async (_req: Request, res: Response): Promise<void> => {
    const data = String(_req.query.data || "");

    if (!data) {
      res.redirect(`${FRONTEND_BASE}/payment?status=failed`);
      return;
    }

    res.redirect(
      `${FRONTEND_BASE}/payment?esewa=success&data=${encodeURIComponent(data)}`
    );
    return;
  },

  // ======================================================
  // eSewa FAILURE CALLBACK
  // ======================================================
  esewaFailure: async (_req: Request, res: Response): Promise<void> => {
    res.redirect(`${FRONTEND_BASE}/payment?status=failed`);
    return;
  },

  // ======================================================
  // eSewa VERIFY (frontend → backend)
  // ======================================================
  esewaVerify: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = String(req.body?.data || "").trim();

      if (!data) {
        res.status(400).json({
          success: false,
          message: "data is required",
        });
        return;
      }

      const payload = esewaService.decodeEsewaData(data);

      const signatureOk = esewaService.verifyEsewaResponseSignature(payload);
      if (!signatureOk) {
        res.status(400).json({
          success: false,
          message: "Invalid eSewa signature",
          payload,
        });
        return;
      }

      const transaction_uuid = String(payload?.transaction_uuid || "").trim();
      const rawAmount = String(payload?.total_amount || "").trim();
      const total_amount = Number(rawAmount.replace(/,/g, ""));

      if (!transaction_uuid || !total_amount || Number.isNaN(total_amount)) {
        res.status(200).json({
          success: true,
          signatureOk: true,
          statusOk: false,
          transaction_uuid: transaction_uuid || null,
          total_amount: rawAmount || null,
          message: "Signature OK but missing/invalid amount or transaction ID",
          payload,
        });
        return;
      }

      let statusOk = true;
      try {
        await esewaService.checkStatus({
          transaction_uuid,
          total_amount,
        });
      } catch {
        statusOk = false;
      }

      res.status(200).json({
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
      return;
    } catch (err) {
      next(err);
      return;
    }
  },

  // ======================================================
  // Khalti INITIATE
  // ======================================================
  khaltiInitiate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, orderId, orderName } = req.body || {};
      const amt = Number(amount);

      if (!amt || Number.isNaN(amt) || amt <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
        return;
      }

      if (!orderId || !orderName) {
        res.status(400).json({
          success: false,
          message: "orderId and orderName required",
        });
        return;
      }

      const data = await khaltiService.initiatePayment({
        amount: amt,
        orderId,
        orderName,
      });

      res.status(200).json({
        success: true,
        payment_url: data?.payment_url,
        pidx: data?.pidx,
        raw: data,
      });
      return;
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || "Khalti initiate failed",
      });
      return;
    }
  },

  // ======================================================
  // Khalti LOOKUP / VERIFY
  // ======================================================
  khaltiLookup: async (req: Request, res: Response): Promise<void> => {
    try {
      const { pidx } = req.body || {};

      if (!pidx) {
        res.status(400).json({
          success: false,
          message: "pidx is required",
        });
        return;
      }

      const data = await khaltiService.lookupPayment({ pidx });

      const status = String(data?.status || "");
      const paid = status.toLowerCase() === "completed";

      res.status(200).json({
        success: true,
        paid,
        status,
        transaction_id: data?.transaction_id || data?.txnId || null,
        amount: data?.total_amount ?? data?.amount ?? null,
        raw: data,
      });
      return;
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || "Khalti lookup failed",
      });
      return;
    }
  },
};