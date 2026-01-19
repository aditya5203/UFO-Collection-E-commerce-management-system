import { Router } from "express";
import { reviewController } from "../controllers/reviews.controller";
import { customerAuthMiddleware } from "../../auth/middleware/auth.middleware";

const router = Router();

// Public: get product reviews
router.get("/:productId/reviews", reviewController.getByProduct);

// Protected: create review (customer only)
router.post("/:productId/reviews", customerAuthMiddleware, reviewController.create);

export default router;
