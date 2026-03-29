// server/src/modules/reviews/routes/reviews.routes.ts
import { Router } from "express";
import { reviewController } from "../controllers/reviews.controller";
import { customerAuthMiddleware } from "../../auth/middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Product reviews
 */

/**
 * @swagger
 * /api/products/{productId}/reviews:
 *   get:
 *     summary: Get product reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product reviews with summary
 */
router.get("/:productId/reviews", reviewController.getByProduct);

/**
 * @swagger
 * /api/products/{productId}/reviews:
 *   post:
 *     summary: Create review for delivered purchased product
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Review submitted
 *       401:
 *         description: Unauthorized
 */
router.post("/:productId/reviews", customerAuthMiddleware, reviewController.create);

export default router;