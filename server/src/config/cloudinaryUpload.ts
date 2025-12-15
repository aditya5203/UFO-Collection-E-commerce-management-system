import multer, { type StorageEngine } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "ufo-collection/products",
    resource_type: "image",
  }),
}) as unknown as StorageEngine; // ✅ fixes TS mismatch

export const upload = multer({ storage });
