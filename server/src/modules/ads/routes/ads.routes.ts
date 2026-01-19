import { Router } from "express";
import { adsController } from "../controllers/ads.controller";

import multer, { type StorageEngine } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../../config/cloudinary";

/**
 * ✅ Ads uploader: image + video to Cloudinary
 * Supports:
 *  - single:  field "file"
 *  - multi:   field "files"
 */
function adsCloudinaryUploader(folder: string) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
      return {
        folder,
        resource_type: "auto", // ✅ supports image + video
      };
    },
  }) as unknown as StorageEngine;

  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (video)
    fileFilter: (_req, file, cb) => {
      const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
      if (!ok) return cb(new Error("Only image/video files are allowed"));
      cb(null, true);
    },
  });
}

const adsUpload = adsCloudinaryUploader("ufo-collection/ads");

/* ===================== PUBLIC ROUTER ===================== */
export const publicRouter = Router();

// GET /api/ads?position=Home%20Top&status=Active
publicRouter.get("/", adsController.publicList);

/* ===================== ADMIN ROUTER ===================== */
export const adminRouter = Router();

// GET /api/admin/ads
adminRouter.get("/", adsController.adminList);

// GET /api/admin/ads/history
adminRouter.get("/history", adsController.historyList);

// ✅ POST /api/admin/ads
// Accept both single + multiple
adminRouter.post(
  "/",
  adsUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 10 },
  ]),
  adsController.create
);

// ✅ PATCH /api/admin/ads/:id
adminRouter.patch(
  "/:id",
  adsUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 10 },
  ]),
  adsController.update
);

// PATCH /api/admin/ads/:id/toggle
adminRouter.patch("/:id/toggle", adsController.toggle);

// DELETE /api/admin/ads/:id
adminRouter.delete("/:id", adsController.remove);

export default { publicRouter, adminRouter };
