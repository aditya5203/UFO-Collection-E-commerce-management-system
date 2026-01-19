import { Router } from "express";
import { adminTicketController } from "../controllers/admin.ticket.controller";

const router = Router();

// GET /api/admin/tickets
router.get("/", adminTicketController.list);

// GET /api/admin/tickets/:id
router.get("/:id", adminTicketController.getOne);

// PATCH /api/admin/tickets/:id/status
router.patch("/:id/status", adminTicketController.updateStatus);

// POST /api/admin/tickets/:id/reply
router.post("/:id/reply", adminTicketController.reply);

export default router;
