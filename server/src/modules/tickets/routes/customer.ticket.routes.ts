import { Router } from "express";
import { customerTicketController } from "../controllers/customer.ticket.controller";
import { customerAuthMiddleware } from "../../auth/middleware/auth.middleware";
import { cloudinaryUploader } from "../../../config/cloudinaryUpload";

const router = Router();
const ticketUpload = cloudinaryUploader("ufo-collection/tickets");

router.use(customerAuthMiddleware);

router.get("/my", customerTicketController.myList);

router.post("/my", ticketUpload.single("image"), customerTicketController.create);

router.get("/my/:id", customerTicketController.myOne);

router.post("/my/:id/reply", customerTicketController.reply);

export default router;