// server/src/modules/product/routes/product.routes.ts
import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { adminAuthMiddleware, authorize } from "../../auth/middleware/auth.middleware";
import { upload } from "../../../config/cloudinaryUpload";

const publicRouter = Router();
const adminRouter = Router();

/* ---------- Public ---------- */
publicRouter.get("/", productController.getAllPublic);
publicRouter.get("/:id", productController.getById);

/* ---------- Admin ---------- */
adminRouter.use(adminAuthMiddleware);
adminRouter.use(authorize("admin", "superadmin"));

/**
 * Single upload (main image)
 * POST /api/admin/products/upload-image
 * form-data: file
 */
adminRouter.post("/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // multer-storage-cloudinary exposes URL in `path`
  const imageUrl = (req.file as any).path as string;
  return res.status(201).json({ imageUrl });
});

/**
 * Multiple upload (gallery)
 * POST /api/admin/products/upload-images
 * form-data: files
 */
adminRouter.post("/upload-images", upload.array("files", 10), (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const imageUrls = files.map((f: any) => f.path as string);
  return res.status(201).json({ imageUrls });
});

/* CRUD */
adminRouter.get("/", productController.getAllForAdmin);
adminRouter.post("/", productController.create);
adminRouter.get("/:id", productController.getById);
adminRouter.patch("/:id", productController.update);
adminRouter.delete("/:id", productController.remove);

export default { publicRouter, adminRouter };
