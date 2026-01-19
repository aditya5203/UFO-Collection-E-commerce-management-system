import { Router } from "express";
import { customerTicketController } from "../controllers/customer.ticket.controller";

// Use your existing customer auth middleware if you have it.
// Example:
// import { customerAuthMiddleware } from "../../auth/middleware/auth.middleware";

const router = Router();

// If you have middleware, enable it like:
// router.use(customerAuthMiddleware);

router.get("/my", customerTicketController.myList);
router.get("/my/:id", customerTicketController.myOne);
router.post("/my/:id/reply", customerTicketController.reply); // optional

export default router;
