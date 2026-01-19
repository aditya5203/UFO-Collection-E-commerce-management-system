import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
import { cloudinaryUploader } from "../../../config/cloudinaryUpload";

const router = Router();
const ticketUpload = cloudinaryUploader("ufo-collection/tickets");

// POST /api/tickets
router.post("/", ticketUpload.single("image"), ticketController.create);

export default router;
