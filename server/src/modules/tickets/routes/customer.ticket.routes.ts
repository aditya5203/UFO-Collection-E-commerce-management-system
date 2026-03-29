// server/src/modules/tickets/routes/customer.ticket.routes.ts
import { Router } from "express";
import { customerTicketController } from "../controllers/customer.ticket.controller";
import { customerAuthMiddleware } from "../../auth/middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Tickets - Customer
 *     description: Customer support ticket endpoints
 */

router.use(customerAuthMiddleware);

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: Get my tickets
 *     tags: [Tickets - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: My tickets list
 */
router.get("/my", customerTicketController.myList);

/**
 * @swagger
 * /api/tickets/my:
 *   post:
 *     summary: Create my support ticket
 *     tags: [Tickets - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post("/my", customerTicketController.create);

/**
 * @swagger
 * /api/tickets/my/{id}:
 *   get:
 *     summary: Get my ticket detail
 *     tags: [Tickets - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ticket detail
 */
router.get("/my/:id", customerTicketController.myOne);

/**
 * @swagger
 * /api/tickets/my/{id}/reply:
 *   post:
 *     summary: Reply to my ticket
 *     tags: [Tickets - Customer]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Reply added
 */
router.post("/my/:id/reply", customerTicketController.reply);

export default router;