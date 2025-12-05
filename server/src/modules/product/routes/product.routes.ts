import { Router } from "express";
import path from "path";
import multer from "multer";

import { productController } from "../controllers/product.controller";
import authMiddleware, {
  authorize,
} from "../../auth/middleware/auth.middleware";

const publicRouter = Router();
const adminRouter = Router();

/* ---------------------------------------------------
 * Multer config for image uploads
 * --------------------------------------------------*/

// src/modules/product/routes → ../../../../ → server → public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../../../public/uploads");
    console.log("UPLOAD PATH:", uploadPath); // debug
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename =
      Date.now() + "-" + Math.round(Math.random() * 1e9).toString() + ext;
    cb(null, filename);
  },
});

const upload = multer({ storage });

/* ---------- Public routes (frontend) ---------- */
publicRouter.get("/", productController.getAllPublic);
publicRouter.get("/:id", productController.getById);

/* ---------- Admin routes (dashboard) ---------- */
adminRouter.use(authMiddleware);
adminRouter.use(authorize("admin", "superadmin"));

adminRouter.post("/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileName = req.file.filename;
  const baseUrl = process.env.API_BASE_URL || "http://localhost:8080";
  const imageUrl = `${baseUrl}/uploads/${fileName}`;

  return res.status(201).json({ imageUrl });
});

// existing CRUD routes
adminRouter.get("/", productController.getAllForAdmin);
adminRouter.post("/", productController.create);
adminRouter.get("/:id", productController.getById);
adminRouter.patch("/:id", productController.update);
adminRouter.delete("/:id", productController.remove);

export default {
  publicRouter,
  adminRouter,
};
