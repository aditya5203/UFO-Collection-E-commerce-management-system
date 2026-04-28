// server/src/modules/newsletter/routes/newsletter.routes.ts

import { Router } from "express";
import { newsletterController } from "../controllers/newsletter.controller";

const router = Router();

router.post("/subscribe", newsletterController.subscribe);

export default router;