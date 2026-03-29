// server/src/modules/discounts/routes/discount.routes.ts
import { Router } from "express";
import { discountController } from "../controllers/discount.controller";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const publicRouter = Router();
const customerRouter = Router();
const adminRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Discounts - Public
 *     description: Public discount endpoints
 *   - name: Discounts - Customer
 *     description: Customer discount collection and validation
 *   - name: Discounts - Admin
 *     description: Admin coupon management
 */

/**
 * @swagger
 * /api/discounts/available:
 *   get:
 *     summary: Get active coupons for public display
 *     tags: [Discounts - Public]
 *     responses:
 *       200:
 *         description: Available coupons
 */
publicRouter.get("/available", discountController.available);

/**
 * @swagger
 * /api/discounts/collect/{code}:
 *   post:
 *     summary: Collect one coupon
 *     tags: [Discounts - Customer]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon collected
 *       401:
 *         description: Unauthorized
 */
customerRouter.post("/collect/:code", discountController.collect);

/**
 * @swagger
 * /api/discounts/my-collected:
 *   get:
 *     summary: Get my collected coupons
 *     tags: [Discounts - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: My collected coupons
 *       401:
 *         description: Unauthorized
 */
customerRouter.get("/my-collected", discountController.myCollected);

/**
 * @swagger
 * /api/discounts/validate:
 *   post:
 *     summary: Validate coupon on current cart
 *     tags: [Discounts - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Invalid coupon/cart
 */
customerRouter.post("/validate", discountController.validate);

/**
 * @swagger
 * /api/discounts/collect-all:
 *   post:
 *     summary: Collect all available coupons
 *     tags: [Discounts - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All available coupons collected
 *       401:
 *         description: Unauthorized
 */
customerRouter.post("/collect-all", discountController.collectAll);

/**
 * @swagger
 * /api/admin/discounts:
 *   get:
 *     summary: List all coupons
 *     tags: [Discounts - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Coupons list
 *       403:
 *         description: Forbidden
 */
adminRouter.get(
  "/",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("discountView"),
  discountController.adminList
);

/**
 * @swagger
 * /api/admin/discounts:
 *   post:
 *     summary: Create coupon
 *     tags: [Discounts - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Coupon created
 *       403:
 *         description: Forbidden
 */
adminRouter.post(
  "/",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("discountCreate"),
  discountController.adminCreate
);

/**
 * @swagger
 * /api/admin/discounts/{id}:
 *   patch:
 *     summary: Update coupon
 *     tags: [Discounts - Admin]
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
 *         description: Coupon updated
 *       403:
 *         description: Forbidden
 */
adminRouter.patch(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("discountEdit"),
  discountController.adminUpdate
);

/**
 * @swagger
 * /api/admin/discounts/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Discounts - Admin]
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
 *         description: Coupon deleted
 *       403:
 *         description: Forbidden
 */
adminRouter.delete(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("discountDelete"),
  discountController.adminDelete
);

/**
 * @swagger
 * /api/admin/discounts/collected/list:
 *   get:
 *     summary: List collected coupons
 *     tags: [Discounts - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Collected coupon list
 *       403:
 *         description: Forbidden
 */
adminRouter.get(
  "/collected/list",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("discountView"),
  discountController.adminCollected
);

export default {
  publicRouter,
  customerRouter,
  adminRouter,
};