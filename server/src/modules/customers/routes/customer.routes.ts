// server/src/modules/customers/routes/customer.routes.ts
import { Router } from "express";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";
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
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, blocked, deleted]
 *         description: Filter customers
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
  authorizePermission("customerView"),
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
  authorizePermission("customerView"),
  customerController.getOne
);

/**
 * @swagger
 * /api/admin/customers/{id}/block:
 *   patch:
 *     summary: Block customer
 *     tags: [Customers - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Customer blocked
 */
adminRouter.patch(
  "/:id/block",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("customerEdit"),
  customerController.block
);

/**
 * @swagger
 * /api/admin/customers/{id}/unblock:
 *   patch:
 *     summary: Unblock customer
 *     tags: [Customers - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Customer unblocked
 */
adminRouter.patch(
  "/:id/unblock",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("customerEdit"),
  customerController.unblock
);

/**
 * @swagger
 * /api/admin/customers/{id}:
 *   delete:
 *     summary: Soft delete customer
 *     tags: [Customers - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Customer deleted
 */
adminRouter.delete(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("customerDelete"),
  customerController.remove
);

/**
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
 *         description: Customer not found
 */
adminRouter.get(
  "/:id/addresses",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("customerView"),
  customerController.getAddresses
);

export default { adminRouter };