import { Router } from "express";
import { discountController } from "../controllers/discount.controller";
import { authorize } from "../../auth/middleware/auth.middleware";

const publicRouter = Router();
const customerRouter = Router();
const adminRouter = Router();

/**
 * ✅ PUBLIC (NO LOGIN)
 * GET /api/discounts/available
 */
publicRouter.get("/available", discountController.available);

/**
 * ✅ CUSTOMER (auth handled in routes/index.ts)
 */
customerRouter.post("/collect/:code", discountController.collect);
customerRouter.get("/my-collected", discountController.myCollected);
customerRouter.post("/validate", discountController.validate);
customerRouter.post("/collect-all", discountController.collectAll);

/**
 * ✅ ADMIN (auth handled in routes/index.ts)
 */
adminRouter.get("/", authorize("admin", "superadmin"), discountController.adminList);
adminRouter.post("/", authorize("admin", "superadmin"), discountController.adminCreate);
adminRouter.patch("/:id", authorize("admin", "superadmin"), discountController.adminUpdate);
adminRouter.delete("/:id", authorize("admin", "superadmin"), discountController.adminDelete);
adminRouter.get("/collected/list", authorize("admin", "superadmin"), discountController.adminCollected);

export default {
  publicRouter,
  customerRouter,
  adminRouter,
};
