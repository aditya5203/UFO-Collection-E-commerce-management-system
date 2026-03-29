// server/src/modules/reviews/routes/admin.reviews.routes.ts
import { Router } from "express";
import { adminReviewsController } from "../controllers/admin.reviews.controller";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reviews - Admin
 *     description: Admin reviews management
 */

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: List reviews
 *     tags: [Reviews - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, comment, or orderCode
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Reviews list
 *       403:
 *         description: Forbidden
 */
router.get(
  "/",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("reviewView"),
  adminReviewsController.list
);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews - Admin]
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
 *         description: Review deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Review not found
 */
router.delete(
  "/:id",
  adminAuthMiddleware,
  authorize("admin", "superadmin"),
  authorizePermission("reviewDelete"),
  adminReviewsController.remove
);

export default router;