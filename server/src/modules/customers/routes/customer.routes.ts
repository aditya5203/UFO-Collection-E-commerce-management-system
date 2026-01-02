// server/src/modules/customers/routes/customer.routes.ts
import { Router } from "express";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { customerController } from "../controllers/customer.controller";

const adminRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Customers - Admin
 *     description: Admin customers management
 */

/**
 * @swagger
 * /api/admin/customers:
 *   get:
 *     summary: List customers
 *     tags: [Customers - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search customers by name/email
 *     responses:
 *       200:
 *         description: Customers list
 *       401:
 *         description: Unauthorized
 */
adminRouter.get(
  "/",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  customerController.list
);

/**
 * @swagger
 * /api/admin/customers/{id}:
 *   get:
 *     summary: Get customer by id
 *     tags: [Customers - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ObjectId
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 */
adminRouter.get(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  customerController.getOne
);

/**
 * ✅ NEW: Customer saved addresses (Shipping + Billing)
 *
 * @swagger
 * /api/admin/customers/{id}/addresses:
 *   get:
 *     summary: Get customer addresses (Shipping + Billing)
 *     tags: [Customers - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ObjectId
 *     responses:
 *       200:
 *         description: Customer addresses
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found (optional)
 */
adminRouter.get(
  "/:id/addresses",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  customerController.getAddresses // ✅ this must exist in controller
);

export default { adminRouter };
