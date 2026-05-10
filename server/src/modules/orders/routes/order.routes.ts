import { Router } from "express";
import {
  customerAuthMiddleware,
  adminAuthMiddleware,
  deliveryAuthMiddleware,
  authorize,
  anyAuthMiddleware,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";
import { orderController } from "../controllers/order.controller";

const publicRouter = Router();
const adminRouter = Router();

/* ------------------------------------------------------------------
 * PUBLIC / CUSTOMER / DELIVERY Endpoints
 * ------------------------------------------------------------------*/

/**
 * @swagger
 * tags:
 *   - name: Orders - Public
 *     description: Customer order endpoints including checkout, order history, tracking, invoice, cancellation, return, exchange, and refund details
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create an order
 *     description: Create a customer order using COD, Khalti, eSewa, or Fonepay.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
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
 */
publicRouter.get("/my", customerAuthMiddleware, orderController.getMyOrders);

/**
 * @swagger
 * /api/orders/my/{id}/cancel-request:
 *   post:
 *     summary: Submit cancellation request for customer's own order
 *     description: Customer can request cancellation only before the order is shipped/transit/delivered.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 */
publicRouter.post(
  "/my/:id/cancel-request",
  customerAuthMiddleware,
  orderController.requestCancellation
);

/**
 * @swagger
 * /api/orders/my/{id}/return-request:
 *   post:
 *     summary: Submit return/refund/exchange request for customer's own delivered order
 *     description: Customer can request Return & Refund or Exchange after the order has been delivered.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "#123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Wrong size received
 *               type:
 *                 type: string
 *                 enum:
 *                   - RETURN_REFUND
 *                   - EXCHANGE
 *                   - DAMAGED
 *                   - WRONG_ITEM
 *                   - SIZE_COLOR_ISSUE
 *                   - NOT_SATISFIED
 *                   - OTHER
 *                 example: SIZE_COLOR_ISSUE
 *               preferredResolution:
 *                 type: string
 *                 enum: [REFUND, EXCHANGE]
 *                 example: EXCHANGE
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - https://example.com/damaged-product.jpg
 */
publicRouter.post(
  "/my/:id/return-request",
  customerAuthMiddleware,
  orderController.requestReturn
);

/**
 * @swagger
 * /api/orders/my/{id}/refund-details:
 *   post:
 *     summary: Submit refund account details
 *     description: Customer submits bank/eSewa/Khalti/Fonepay refund details after admin requests them.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "#123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [BANK, KHALTI, ESEWA, FONEPAY]
 *                 example: ESEWA
 *               accountName:
 *                 type: string
 *                 example: Baiju Pandit
 *               accountNumber:
 *                 type: string
 *                 example: "123456789012"
 *               bankName:
 *                 type: string
 *                 example: Nabil Bank
 *               walletNumber:
 *                 type: string
 *                 example: "9800000000"
 *               walletId:
 *                 type: string
 *                 example: baiju@esewa
 *               customerNote:
 *                 type: string
 *                 example: Please refund to this wallet.
 */
publicRouter.post(
  "/my/:id/refund-details",
  customerAuthMiddleware,
  orderController.submitRefundDetails
);

/**
 * @swagger
 * /api/orders/my/{id}:
 *   get:
 *     summary: Get logged-in customer's order details
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
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
 */
publicRouter.get("/track/:code", orderController.track);

/**
 * @swagger
 * /api/orders/delivery/{id}/pickup-status:
 *   patch:
 *     summary: Delivery rider updates return/exchange pickup status
 *     description: Delivery rider updates Return Pickup or Exchange Pickup task status.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "#123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               taskType:
 *                 type: string
 *                 enum: [RETURN_PICKUP, EXCHANGE_PICKUP]
 *                 example: RETURN_PICKUP
 *               status:
 *                 type: string
 *                 enum:
 *                   - Picked Up
 *                   - Returned to Store
 *                   - Failed Delivery
 *                 example: Picked Up
 *               note:
 *                 type: string
 *                 example: Product collected from customer.
 *               photo:
 *                 type: string
 *                 example: https://example.com/pickup-proof.jpg
 */
publicRouter.patch(
  "/delivery/:id/pickup-status",
  deliveryAuthMiddleware,
  orderController.updateReturnOrExchangePickupByDelivery
);

/**
 * @swagger
 * /api/orders/delivery/{id}/replacement-status:
 *   patch:
 *     summary: Delivery rider updates replacement delivery status
 *     description: Delivery rider updates exchange replacement delivery task status.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "#123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - Picked Up
 *                   - Out for Delivery
 *                   - Delivered
 *                   - Failed Delivery
 *                 example: Delivered
 *               note:
 *                 type: string
 *                 example: Replacement delivered to customer.
 *               photo:
 *                 type: string
 *                 example: https://example.com/delivery-proof.jpg
 */
publicRouter.patch(
  "/delivery/:id/replacement-status",
  deliveryAuthMiddleware,
  orderController.updateReplacementDeliveryByDelivery
);

/**
 * @swagger
 * /api/orders/{id}/invoice:
 *   get:
 *     summary: Download invoice PDF
 *     description: Customer can download their own order invoice. Admin can download any order invoice.
 *     tags: [Orders - Public]
 *     security:
 *       - cookieAuth: []
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
 *     description: Admin order management, delivery assignment, cancellation, return, refund, and exchange workflow
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: List all orders
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
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
 * /api/admin/orders/returns-refunds:
 *   get:
 *     summary: List cancellation, return, refund, and exchange requests
 *     description: Returns combined list of cancellation, return, refund, and exchange records.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CANCELLATION, RETURN, REFUND, EXCHANGE]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - NONE
 *             - REQUESTED
 *             - APPROVED
 *             - REJECTED
 *             - PICKUP_ASSIGNED
 *             - PICKED_UP
 *             - RECEIVED
 *             - PENDING
 *             - PENDING_ACCOUNT_DETAILS
 *             - READY_TO_REFUND
 *             - PROCESSING
 *             - REFUNDED
 *             - FAILED
 *             - REPLACEMENT_ASSIGNED
 *             - REPLACEMENT_DELIVERED
 *             - COMPLETED
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
adminRouter.get(
  "/returns-refunds",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderView"),
  orderController.listReturnsRefunds
);

/**
 * @swagger
 * /api/admin/orders/{id}/cancel/approve:
 *   patch:
 *     summary: Approve order cancellation request
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/cancel/approve",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.approveCancellation
);

/**
 * @swagger
 * /api/admin/orders/{id}/cancel/reject:
 *   patch:
 *     summary: Reject order cancellation request
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/cancel/reject",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.rejectCancellation
);

/**
 * @swagger
 * /api/admin/orders/{id}/return/approve:
 *   patch:
 *     summary: Approve return or exchange request
 *     description: Admin approves customer return/refund or exchange request. After approval admin should assign pickup rider.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/return/approve",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.approveReturn
);

/**
 * @swagger
 * /api/admin/orders/{id}/return/reject:
 *   patch:
 *     summary: Reject return or exchange request
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/return/reject",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.rejectReturn
);

/**
 * @swagger
 * /api/admin/orders/{id}/return/assign-pickup:
 *   patch:
 *     summary: Assign delivery rider for return pickup
 *     description: Admin assigns rider to collect returned product from customer.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/return/assign-pickup",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.assignReturnPickup
);

/**
 * @swagger
 * /api/admin/orders/{id}/exchange/assign-pickup:
 *   patch:
 *     summary: Assign delivery rider for exchange pickup
 *     description: Admin assigns rider to collect damaged/wrong/size issue product from customer.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/exchange/assign-pickup",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.assignExchangePickup
);

/**
 * @swagger
 * /api/admin/orders/{id}/return/mark-received:
 *   patch:
 *     summary: Mark returned product as received
 *     description: Admin verifies returned product has reached store/warehouse.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/return/mark-received",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.markProductReceived
);

/**
 * @swagger
 * /api/admin/orders/{id}/refund/request-details:
 *   patch:
 *     summary: Request refund account details from customer
 *     description: Admin asks customer to submit bank/wallet details for refund.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/refund/request-details",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.requestRefundDetails
);

/**
 * @swagger
 * /api/admin/orders/{id}/refund/processing:
 *   patch:
 *     summary: Mark refund as processing
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/refund/processing",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.markRefundProcessing
);

/**
 * @swagger
 * /api/admin/orders/{id}/refund/mark-refunded:
 *   patch:
 *     summary: Mark refund as completed
 *     description: Admin manually marks refund completed after sending money through bank/wallet.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/refund/mark-refunded",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.markRefunded
);

/**
 * @swagger
 * /api/admin/orders/{id}/exchange/assign-replacement:
 *   patch:
 *     summary: Assign delivery rider for replacement delivery
 *     description: Admin assigns rider to deliver replacement product after old product is received.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/exchange/assign-replacement",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.assignReplacementDelivery
);

/**
 * @swagger
 * /api/admin/orders/{id}/exchange/complete:
 *   patch:
 *     summary: Complete exchange request
 *     description: Admin completes exchange after replacement product has been delivered.
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
 */
adminRouter.patch(
  "/:id/exchange/complete",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("orderUpdate"),
  orderController.completeExchange
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order by id or order code
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
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
 *     summary: Update order status, payment status, or normal delivery assignment
 *     tags: [Orders - Admin]
 *     security:
 *       - cookieAuth: []
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