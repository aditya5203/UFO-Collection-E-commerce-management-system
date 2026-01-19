import multer from "multer";

/**
 * Memory upload (file.buffer) for Cloudinary upload_stream.
 * Supports image + video for ads.
 */
export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (video needs more)
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) return cb(new Error("Only image/video files are allowed"));
    cb(null, true);
  },
});
