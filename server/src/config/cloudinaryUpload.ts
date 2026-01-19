// server/src/config/cloudinaryUploads.ts
import multer, { type StorageEngine } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";

/**
 * ✅ Image-only Cloudinary uploader
 * Usage:
 *   cloudinaryUploader("ufo-collection/tickets").single("image")
 *
 * Good for: product images, ticket images, etc.
 */
export function cloudinaryUploader(folder: string) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder,
      resource_type: "image",
    }),
  }) as unknown as StorageEngine;

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB images
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
      }
      cb(null, true);
    },
  });
}

/**
 * ✅ Auto Cloudinary uploader (image + video)
 * Usage:
 *   cloudinaryUploaderAuto("ufo-collection/ads").single("file")
 *
 * Good for: Ads (image/video), banners, promo videos, etc.
 */
export function cloudinaryUploaderAuto(folder: string) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder,
      resource_type: "auto", // ✅ IMPORTANT (supports image + video)
    }),
  }) as unknown as StorageEngine;

  return multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos too
    fileFilter: (_req, file, cb) => {
      const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
      if (!ok) return cb(new Error("Only image/video files are allowed"));
      cb(null, true);
    },
  });
}

/**
 * ✅ Backward compatible product uploader (image only)
 * Existing code depends on this.
 */
export const upload = cloudinaryUploader("ufo-collection/products");

/**
 * ✅ Ads uploader (image + video)
 * Use this in ads.routes.ts:
 *   import { adsUpload } from "../../../config/cloudinaryUploads";
 *   adsUpload.single("file")
 */
export const adsUpload = cloudinaryUploaderAuto("ufo-collection/ads");
