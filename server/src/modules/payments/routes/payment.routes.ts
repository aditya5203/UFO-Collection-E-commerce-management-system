// server/src/modules/payments/routes/payment.routes.ts

import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment gateway endpoints (eSewa, Khalti)
 */

/**
 * @swagger
 * /api/payments/esewa/initiate:
 *   get:
 *     tags: [Payments]
 *     summary: Initiate eSewa payment (returns HTML auto-submit form)
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           example: 5510
 *         description: Amount in NPR
 *     responses:
 *       200:
 *         description: HTML page that auto-posts to eSewa payment gateway
 *       400:
 *         description: Invalid amount
 */

/**
 * @swagger
 * /api/payments/esewa/initiate-json:
 *   get:
 *     tags: [Payments]
 *     summary: Debug eSewa initiate (returns formUrl + fields as JSON for Swagger)
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           example: 5510
 *         description: Amount in NPR
 *     responses:
 *       200:
 *         description: Debug payload for eSewa form (useful in Swagger)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 formUrl:
 *                   type: string
 *                   example: https://uat.esewa.com.np/api/epay/main/v2/form
 *                 fields:
 *                   type: object
 *                   additionalProperties: true
 *                 note:
 *                   type: string
 *       400:
 *         description: Invalid amount
 */

/**
 * @swagger
 * /api/payments/esewa/success:
 *   get:
 *     tags: [Payments]
 *     summary: eSewa success callback (redirects to frontend)
 *     responses:
 *       302:
 *         description: Redirect to frontend payment page (finalization happens on frontend)
 */

/**
 * @swagger
 * /api/payments/esewa/failure:
 *   get:
 *     tags: [Payments]
 *     summary: eSewa failure callback (redirects to payment failed page)
 *     responses:
 *       302:
 *         description: Redirect to payment page with failed status
 */

/**
 * @swagger
 * /api/payments/esewa/verify:
 *   post:
 *     tags: [Payments]
 *     summary: Verify eSewa success payload (called by frontend after redirect)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: string
 *                 description: Base64 encoded eSewa "data" query param from success callback
 *     responses:
 *       200:
 *         description: Verified successfully
 *       400:
 *         description: Invalid payload/signature/status
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payments/khalti/initiate:
 *   post:
 *     tags: [Payments]
 *     summary: Initiate Khalti payment (returns payment_url)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, orderId, orderName]
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount in paisa (Rs.100 = 10000)
 *                 example: 1000
 *               orderId:
 *                 type: string
 *                 example: ORDER_123
 *               orderName:
 *                 type: string
 *                 example: UFO Collection Order
 *     responses:
 *       200:
 *         description: Initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payment_url:
 *                   type: string
 *                   example: https://dev.khalti.com/...
 *                 pidx:
 *                   type: string
 *                   example: pidx_xxxxx
 *                 raw:
 *                   type: object
 *       400:
 *         description: Invalid input (amount/orderId/orderName)
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/payments/khalti/lookup:
 *   post:
 *     tags: [Payments]
 *     summary: Lookup/verify Khalti payment by pidx
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pidx]
 *             properties:
 *               pidx:
 *                 type: string
 *                 example: pidx_xxxxx
 *     responses:
 *       200:
 *         description: Lookup result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paid:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: Completed
 *                 transaction_id:
 *                   type: string
 *                   nullable: true
 *                   example: khalti_txn_xxx
 *                 amount:
 *                   type: integer
 *                   example: 1000
 *                 raw:
 *                   type: object
 *       400:
 *         description: pidx missing
 *       500:
 *         description: Server error
 */

// eSewa
router.get("/esewa/initiate", paymentController.esewaInitiate);
router.get("/esewa/initiate-json", paymentController.esewaInitiateJson);
router.get("/esewa/success", paymentController.esewaSuccess);
router.get("/esewa/failure", paymentController.esewaFailure);

// ✅ NEW: frontend calls this after redirect back from eSewa
router.post("/esewa/verify", paymentController.esewaVerify);

// Khalti
router.post("/khalti/initiate", paymentController.khaltiInitiate);
router.post("/khalti/lookup", paymentController.khaltiLookup);

export default router;
