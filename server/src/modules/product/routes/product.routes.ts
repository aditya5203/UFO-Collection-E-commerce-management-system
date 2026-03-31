// server/src/modules/product/routes/product.routes.ts
import { Router } from "express";
import { productController } from "../controllers/product.controller";
import {
  adminAuthMiddleware,
  authorize,
} from "../../auth/middleware/auth.middleware";
import { authorizePermission } from "../../auth/middleware/permission.middleware";
import { upload } from "../../../config/cloudinaryUpload";

const publicRouter = Router();
const adminRouter = Router();

/* ---------- Public ---------- */
publicRouter.get("/", productController.getAllPublic);
publicRouter.get("/:id/related", productController.getRelated);
publicRouter.get("/:id", productController.getById);

/* ---------- Admin ---------- */
adminRouter.use(adminAuthMiddleware);
adminRouter.use(authorize("admin", "superadmin"));

adminRouter.post(
  "/upload-image",
  authorizePermission("productCreate"),
  upload.single("file"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imageUrl = (req.file as any).path as string;
    return res.status(201).json({ imageUrl });
  }
);

adminRouter.post(
  "/upload-images",
  authorizePermission("productCreate"),
  upload.array("files", 10),
  (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imageUrls = files.map((f: any) => f.path as string);
    return res.status(201).json({ imageUrls });
  }
);

/* CRUD */
adminRouter.get(
  "/",
  authorizePermission("productView"),
  productController.getAllForAdmin
);
adminRouter.post(
  "/",
  authorizePermission("productCreate"),
  productController.create
);
adminRouter.get(
  "/:id",
  authorizePermission("productView"),
  productController.getById
);
adminRouter.patch(
  "/:id",
  authorizePermission("productEdit"),
  productController.update
);
adminRouter.delete(
  "/:id",
  authorizePermission("productDelete"),
  productController.remove
);

export default { publicRouter, adminRouter };