import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { cloudinaryUploader } from "../../../config/cloudinaryUpload";

const router = Router();

router.get("/ping", (_req, res) => {
  res.json({ success: true, message: "AI route working" });
});

router.post(
  "/tryon",
  cloudinaryUploader("ufo-collection/tryon-inputs").single("personImage"),
  aiController.tryOn
);

export default router;