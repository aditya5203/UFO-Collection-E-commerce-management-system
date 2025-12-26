import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

// eSewa
router.get("/esewa/initiate", paymentController.esewaInitiate);
router.get("/esewa/success", paymentController.esewaSuccess);
router.get("/esewa/failure", paymentController.esewaFailure);

// Khalti
router.post("/khalti/initiate", paymentController.khaltiInitiate);

export default router;
