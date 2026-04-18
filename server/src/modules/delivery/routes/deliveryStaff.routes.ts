import { Router } from "express";
import { deliveryStaffController } from "../controllers/deliveryStaff.controller";
import {
  adminAuthMiddleware,
  deliveryAuthMiddleware,
} from "../../auth/middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Delivery Staff
 *     description: Delivery rider self-service and admin delivery staff management APIs
 */

/* =========================================================
 * Delivery rider self-service
 * =======================================================*/

/**
 * @swagger
 * /api/delivery-staff/me/dashboard:
 *   get:
 *     summary: Get delivery rider dashboard
 *     description: Returns dashboard data for the currently authenticated delivery rider
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery dashboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not delivery rider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/me/dashboard",
  deliveryAuthMiddleware,
  deliveryStaffController.dashboard
);

/**
 * @swagger
 * /api/delivery-staff/me/orders:
 *   get:
 *     summary: Get my assigned orders
 *     description: Returns orders assigned to the currently authenticated delivery rider
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assigned orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not delivery rider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/me/orders",
  deliveryAuthMiddleware,
  deliveryStaffController.myOrders
);

/**
 * @swagger
 * /api/delivery-staff/me/orders/{id}:
 *   get:
 *     summary: Get my order details
 *     description: Returns details of a specific order assigned to the currently authenticated delivery rider
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f8f12ab34cd56ef78gh90
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid order id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - order not assigned or user is not delivery rider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/me/orders/:id",
  deliveryAuthMiddleware,
  deliveryStaffController.myOrderDetails
);

/**
 * @swagger
 * /api/delivery-staff/me/orders/{id}/status:
 *   patch:
 *     summary: Update my assigned order status
 *     description: Allows the authenticated delivery rider to update the status of an assigned order
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f8f12ab34cd56ef78gh90
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 example: Delivered
 *                 description: New delivery status for the order
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order status updated successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or invalid order status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - order not assigned or user is not delivery rider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
  "/me/orders/:id/status",
  deliveryAuthMiddleware,
  deliveryStaffController.updateMyOrderStatus
);

/* =========================================================
 * Admin delivery staff management
 * =======================================================*/

/**
 * @swagger
 * /api/delivery-staff:
 *   post:
 *     summary: Create delivery rider
 *     description: Allows admin to create a new delivery rider account
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ram Delivery
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rider@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123
 *               phone:
 *                 type: string
 *                 example: 9800000000
 *               vehicleType:
 *                 type: string
 *                 example: Bike
 *               vehicleNumber:
 *                 type: string
 *                 example: BA-01-PA-1234
 *               deliveryArea:
 *                 type: string
 *                 example: Kathmandu
 *     responses:
 *       201:
 *         description: Delivery rider created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Delivery rider created successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Delivery rider already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", adminAuthMiddleware, deliveryStaffController.create);

/**
 * @swagger
 * /api/delivery-staff:
 *   get:
 *     summary: List delivery riders
 *     description: Allows admin to view all delivery riders
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery riders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", adminAuthMiddleware, deliveryStaffController.list);

/**
 * @swagger
 * /api/delivery-staff/{id}:
 *   get:
 *     summary: Get delivery rider by id
 *     description: Allows admin to fetch a specific delivery rider by id
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f8f12ab34cd56ef78gh90
 *         description: Delivery rider user ID
 *     responses:
 *       200:
 *         description: Delivery rider fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Delivery rider not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", adminAuthMiddleware, deliveryStaffController.getById);

/**
 * @swagger
 * /api/delivery-staff/{id}:
 *   put:
 *     summary: Update delivery rider
 *     description: Allows admin to update delivery rider information
 *     tags: [Delivery Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 664f8f12ab34cd56ef78gh90
 *         description: Delivery rider user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ram Delivery Updated
 *               email:
 *                 type: string
 *                 format: email
 *                 example: riderupdated@example.com
 *               phone:
 *                 type: string
 *                 example: 9811111111
 *               vehicleType:
 *                 type: string
 *                 example: Scooter
 *               vehicleNumber:
 *                 type: string
 *                 example: BA-02-PA-5678
 *               deliveryArea:
 *                 type: string
 *                 example: Lalitpur
 *               status:
 *                 type: string
 *                 example: active
 *     responses:
 *       200:
 *         description: Delivery rider updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Delivery rider updated successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Delivery rider not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", adminAuthMiddleware, deliveryStaffController.update);

export default router;