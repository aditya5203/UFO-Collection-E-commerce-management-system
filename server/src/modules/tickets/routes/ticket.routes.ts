// server/src/modules/tickets/routes/ticket.routes.ts
import { Router } from "express";
import { ticketController } from "../controllers/ticket.controller";
import { cloudinaryUploader } from "../../../config/cloudinaryUpload";
import { anyAuthMiddleware } from "../../auth/middleware/auth.middleware";

const router = Router();
const ticketUpload = cloudinaryUploader("ufo-collection/tickets");

/**
 * @swagger
 * tags:
 *   - name: Tickets
 *     description: Public or mixed ticket creation endpoints
 */

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create support ticket with optional file
 *     tags: [Tickets]
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post("/", anyAuthMiddleware, ticketUpload.single("image"), ticketController.create);

export default router;