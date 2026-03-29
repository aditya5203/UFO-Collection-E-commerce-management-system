// server/src/modules/tickets/routes/admin.ticket.routes.ts
import { Router } from "express";
import { adminTicketController } from "../controllers/admin.ticket.controller";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Tickets - Admin
 *     description: Admin customer ticket management
 */

router.use(adminAuthMiddleware);
router.use(authorize("admin", "superadmin"));

/**
 * @swagger
 * /api/admin/tickets:
 *   get:
 *     summary: List support tickets
 *     tags: [Tickets - Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tickets list
 */
router.get("/", authorizePermission("ticketView"), adminTicketController.list);

/**
 * @swagger
 * /api/admin/tickets/{id}:
 *   get:
 *     summary: Get support ticket details
 *     tags: [Tickets - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ticket detail
 */
router.get("/:id", authorizePermission("ticketView"), adminTicketController.getOne);

/**
 * @swagger
 * /api/admin/tickets/{id}/status:
 *   patch:
 *     summary: Change ticket status
 *     tags: [Tickets - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Ticket status updated
 */
router.patch(
  "/:id/status",
  authorizePermission("ticketClose"),
  adminTicketController.updateStatus
);

/**
 * @swagger
 * /api/admin/tickets/{id}/reply:
 *   post:
 *     summary: Reply to support ticket
 *     tags: [Tickets - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Reply sent
 */
router.post(
  "/:id/reply",
  authorizePermission("ticketReply"),
  adminTicketController.reply
);

export default router;