import { Router } from "express";
import {
  customerAuthMiddleware,
  adminAuthMiddleware,
  authorize,
  anyAuthMiddleware,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";
import { orderController } from "../controllers/order.controller";

const publicRouter = Router();
const adminRouter = Router();

/* ------------------------------------------------------------------
 * PUBLIC (Customer) Endpoints
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
 *     summary: Create an order (COD / Khalti / eSewa / Fonepay)
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
 *               paymentStatus:
 *                 type: string
 *                 example: "Pending"
 *               shippingPaisa:
 *                 type: number
 *                 example: 10000
 *               couponCode:
 *                 type: string
 *                 nullable: true
 *                 example: "DASH10"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, qty]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "68001234567890abcdef1234"
 *                     variantId:
 *                       type: string
 *                       nullable: true
 *                       example: "68001234567890abcdef5678"
 *                     size:
 *                       type: string
 *                       example: "S"
 *                     color:
 *                       type: string
 *                       example: "#000000"
 *                     colorLabel:
 *                       type: string
 *                       example: "Black"
 *                     sku:
 *                       type: string
 *                       nullable: true
 *                       example: "LIGHT-BLUE-DISTRES-8FB6D6-S"
 *                     qty:
 *                       type: number
 *                       example: 1
 *               address:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: "Baiju Pandit"
 *                   phone:
 *                     type: string
 *                     example: "9800000000"
 *                   provinceId:
 *                     type: string
 *                     example: "bagmati"
 *                   district:
 *                     type: string
 *                     example: "Kathmandu"
 *                   city:
 *                     type: string
 *                     example: "Kathmandu"
 *                   area:
 *                     type: string
 *                     example: "Baneshwor"
 *                   addressLine:
 *                     type: string
 *                     example: "Old Baneshwor"
 *                   street:
 *                     type: string
 *                     example: "Main road"
 *                   postalCode:
 *                     type: string
 *                     example: "44600"
 *                   lat:
 *                     type: number
 *                     example: 27.7172
 *                   lng:
 *                     type: number
 *                     example: 85.324
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
 * @swagger
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Download invoice PDF (customer own order or admin any order)
 *     tags: [Orders - Public]
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
 *         description: Invoice PDF
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
publicRouter.get(
  "/:id/invoice",
  anyAuthMiddleware,
  orderController.downloadInvoice
);

/* ------------------------------------------------------------------
 * ADMIN Endpoints
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
 *         description: Search by orderCode or customer name/email
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
 *         description: Pending | Shipped | Transit | Delivered | Cancelled
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
  authorizePermission("orderView"),
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
  authorizePermission("orderView"),
  orderController.getOne
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   patch:
 *     summary: Update order status/payment status/delivery assignment
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
 *                 example: Paid
 *               orderStatus:
 *                 type: string
 *                 example: Transit
 *               deliveryAssignment:
 *                 type: object
 *                 properties:
 *                   deliveryManId:
 *                     type: string
 *                     example: 68001234567890abcdef1234
 *                   note:
 *                     type: string
 *                     example: Call customer before arrival
 *                   status:
 *                     type: string
 *                     example: Assigned
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
  authorizePermission("orderUpdate"),
  orderController.update
);

export default {
  publicRouter,
  adminRouter,
};