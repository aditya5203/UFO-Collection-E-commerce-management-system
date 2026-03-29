import { Request, Response, NextFunction } from "express";
import { productService } from "../../product/services/product.service";
import { aiService } from "../services/ai.service";
import { AppError } from "../../../middleware/error.middleware";

function buildAbsoluteImageUrl(src: string) {
  const apiBase = process.env.PUBLIC_API_BASE_URL || "http://localhost:8080";
  const base = apiBase.replace(/\/$/, "");

  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/uploads/")) return `${base}${src}`;
  if (src.startsWith("uploads/")) return `${base}/${src}`;
  if (src.startsWith("/images/")) return `${base}${src}`;

  return src;
}

function getProductImage(product: any) {
  return (
    product?.image ||
    (Array.isArray(product?.images) && product.images.length > 0
      ? product.images[0]
      : "") ||
    ""
  );
}

function buildGarmentDescription(product: any) {
  const parts = [
    typeof product?.name === "string" ? product.name : "",
    typeof product?.description === "string" ? product.description : "",
  ]
    .map((x) => x.trim())
    .filter(Boolean);

  return parts.join(" - ") || "fashion clothing";
}

const tryOn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file as any;

    const personImageUrl =
      file?.path || file?.secure_url || file?.url || file?.filename || "";

    if (!personImageUrl) {
      throw new AppError("personImage is required", 400);
    }

    const productId = String(req.body?.productId || "").trim();
    if (!productId) {
      throw new AppError("productId is required", 400);
    }

    const product = await productService.getById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const rawImage = getProductImage(product);
    const garmentImageUrl = buildAbsoluteImageUrl(String(rawImage || ""));

    if (!garmentImageUrl) {
      throw new AppError("Selected product has no image", 400);
    }

    const garmentDescription = buildGarmentDescription(product);

    const result = await aiService.runTryOn({
      personImageUrl,
      garmentImageUrl,
      garmentDescription,
    });

    return res.json({
      success: true,
      imageUrl: result.imageUrl,
      source: result.provider,
      warning: result.warning || null,
    });
  } catch (err) {
    return next(err);
  }
};

export const aiController = {
  tryOn,
};