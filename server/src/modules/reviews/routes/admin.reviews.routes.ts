import { Router } from "express";
import { adminReviewsController } from "../controllers/admin.reviews.controller";
import { authorize } from "../../auth/middleware/auth.middleware";

const router = Router();

/**
 * BASE: /api/admin/reviews
 * Protected already by adminAuthMiddleware in routes/index.ts
 */

// ✅ list reviews (admin/superadmin)
router.get("/", authorize("admin", "superadmin"), adminReviewsController.list);

// ✅ delete review (admin/superadmin)
router.delete("/:id", authorize("admin", "superadmin"), adminReviewsController.remove);

export default router;
