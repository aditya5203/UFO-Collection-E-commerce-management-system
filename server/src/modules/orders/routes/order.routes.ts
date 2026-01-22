// server/src/modules/orders/routes/order.routes.ts

import { Router } from "express";
import {
  customerAuthMiddleware,
  adminAuthMiddleware,
  authorize,
  anyAuthMiddleware, // ✅ NEW
} from "../../auth/middleware/auth.middleware";
import { orderController } from "../controllers/order.controller";

const publicRouter = Router();
const adminRouter = Router();

/* ------------------------------------------------------------------
 * ✅ PUBLIC (Customer) Endpoints
 * ------------------------------------------------------------------*/

/**
 * @swagger
 * tags:
 *   - name: Orders - Public
 *     description: Customer order endpoints (checkout, history, details & tracking)
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order (COD / Khalti / eSewa)
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - items
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 example: "COD"
 *               paymentRef:
 *                 type: string
 *                 example: "pidx_xxxxxx"
 *               shippingPaisa:
 *                 type: number
 *                 example: 0
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, qty]
 *                   properties:
 *                     productId:
 *                       type: string
 *                     size:
 *                       type: string
 *                     qty:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created
 *       401:
 *         description: Unauthorized
 */
publicRouter.post("/", customerAuthMiddleware, orderController.create);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get logged-in customer's order history
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Customer order history
 *       401:
 *         description: Unauthorized
 */
publicRouter.get("/my", customerAuthMiddleware, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders/my/{id}:
 *   get:
 *     summary: Get logged-in customer's order details
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "OrderCode (123456 | #123456) OR MongoId"
 *     responses:
 *       200:
 *         description: Customer order details
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
publicRouter.get(
  "/my/:id",
  customerAuthMiddleware,
  orderController.getMyOrderDetails
);

/**
 * @swagger
 * /api/orders/track/{code}:
 *   get:
 *     summary: Track order by order code
 *     tags: [Orders - Public]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: "OrderCode without # (123456) OR with # (#123456)"
 *     responses:
 *       200:
 *         description: Order tracking info
 *       404:
 *         description: Order not found
 */
publicRouter.get("/track/:code", orderController.track);

/**
 * ✅ NEW: Download Invoice PDF (Admin OR Customer)
 * GET /api/orders/:id/invoice
 *
 * - Admin can download any order invoice
 * - Customer can download only their own invoice
 */
publicRouter.get("/:id/invoice", anyAuthMiddleware, orderController.downloadInvoice);

/* ------------------------------------------------------------------
 * ✅ ADMIN Endpoints
 * ------------------------------------------------------------------*/

/**
 * @swagger
 * tags:
 *   - name: Orders - Admin
 *     description: Admin order management
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List orders
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Search by orderCode or customer name/email"
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders list
 *       401:
 *         description: Unauthorized
 */
adminRouter.get(
  "/",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  orderController.list
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order by id OR orderCode
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
adminRouter.get(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  orderController.getOne
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   patch:
 *     summary: Update order status/payment status
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *               orderStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
adminRouter.patch(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  orderController.update
);

export default {
  publicRouter,
  adminRouter,
};
