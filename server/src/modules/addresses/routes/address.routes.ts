// server/src/modules/addresses/routes/address.routes.ts
import { Router } from "express";
import { addressController } from "../controllers/address.controller";

const router = Router();

router.get("/", addressController.listMine);
router.post("/", addressController.createMine);
router.patch("/:id", addressController.updateMine);
router.delete("/:id", addressController.deleteMine);
router.patch("/:id/default", addressController.setDefault);

export default router;
