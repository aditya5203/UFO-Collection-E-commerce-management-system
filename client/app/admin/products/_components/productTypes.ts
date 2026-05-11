export type ProductStatus = "Active" | "Inactive";
export type Gender = "Male" | "Female";
export type Size = "S" | "M" | "L" | "XL" | "XXL";

export type ProductVariant = {
  id?: string;
  color: string;
  size: Size;
  stock: number;
  sku?: string;
  isActive: boolean;
};

export type ProductVariantForm = {
  id?: string;
  color: string;
  size: Size;
  stock: number | "";
  sku: string;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
  images?: string[];
  gender: Gender;
  colors: string[];
  sizes: Size[];
  variants: ProductVariant[];
  categoryId: string;
};

export type ApiProductVariant = {
  _id?: string;
  id?: string;
  color?: string;
  size?: string;
  stock?: number | string;
  sku?: string;
  isActive?: boolean;
};

export type ApiProduct = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number | string;
  stock?: number | string;
  status?: string;
  image?: string;
  images?: string[];
  gender?: string;
  colors?: string[];
  sizes?: string[];
  variants?: ApiProductVariant[];
  categoryId?: string;
  category?: string | { _id?: string; id?: string };
};

export type ApiCategory = {
  _id?: string;
  id?: string;
  name?: string;
  isActive?: boolean;
};

export type ProductListResponse = {
  success?: boolean;
  message?: string;
  data?:
    | ApiProduct[]
    | {
        products?: ApiProduct[];
        items?: ApiProduct[];
        docs?: ApiProduct[];
        result?: ApiProduct[];
        data?: ApiProduct[];
      };
  products?: ApiProduct[];
  items?: ApiProduct[];
  docs?: ApiProduct[];
  result?: ApiProduct[];
};

export type CategoryListResponse = {
  success?: boolean;
  message?: string;
  data?:
    | ApiCategory[]
    | {
        categories?: ApiCategory[];
        items?: ApiCategory[];
        docs?: ApiCategory[];
        result?: ApiCategory[];
        data?: ApiCategory[];
      };
  categories?: ApiCategory[];
  items?: ApiCategory[];
  docs?: ApiCategory[];
  result?: ApiCategory[];
};

export type ProductSaveResponse = {
  success?: boolean;
  message?: string;
  data?: ApiProduct;
  product?: ApiProduct;
};

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  type: ToastType;
  message: string;
} | null;

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export const PLACEHOLDER = "/images/products/placeholder.png";

export const SIZE_OPTIONS: Size[] = ["S", "M", "L", "XL", "XXL"];

export const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";

export const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

export const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClass =
  "h-[48px] w-full rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]";

export const getImageSrc = (image: string | undefined | null): string => {
  if (!image) return PLACEHOLDER;

  const src = image.trim();
  if (!src) return PLACEHOLDER;
  if (src.startsWith("/")) return src;

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const u = new URL(src);

      const allowedHosts = new Set([
        "res.cloudinary.com",
        "localhost",
        "lh3.googleusercontent.com",
        "images.unsplash.com",
        "t3.ftcdn.net",
      ]);

      const isLocalUpload =
        u.hostname === "localhost" &&
        u.port === "8080" &&
        u.pathname.startsWith("/uploads/");

      if (!allowedHosts.has(u.hostname) && !isLocalUpload) {
        return PLACEHOLDER;
      }

      return src;
    } catch {
      return PLACEHOLDER;
    }
  }

  return PLACEHOLDER;
};

export const formatPriceNPR = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function normalizeStatus(status?: string): ProductStatus {
  return String(status || "").toLowerCase() === "inactive"
    ? "Inactive"
    : "Active";
}

export function normalizeGender(gender?: string): Gender {
  return String(gender || "").toLowerCase() === "female" ? "Female" : "Male";
}

export function normalizeSizes(values?: string[]): Size[] {
  if (!Array.isArray(values)) return [];
  return values.filter((v): v is Size => SIZE_OPTIONS.includes(v as Size));
}

export function normalizeVariant(v: ApiProductVariant): ProductVariant | null {
  const color = String(v.color || "").trim().toLowerCase();
  const size = String(v.size || "").trim().toUpperCase() as Size;
  const stock = Number(v.stock || 0);

  if (!/^#([0-9a-f]{6})$/.test(color)) return null;
  if (!SIZE_OPTIONS.includes(size)) return null;
  if (Number.isNaN(stock) || stock < 0) return null;

  return {
    id: String(v._id || v.id || ""),
    color,
    size,
    stock,
    sku: String(v.sku || ""),
    isActive: v.isActive !== false,
  };
}

export function getProductCategoryId(product: ApiProduct) {
  if (typeof product.categoryId === "string") return product.categoryId;
  if (typeof product.category === "string") return product.category;

  if (product.category && typeof product.category === "object") {
    return String(product.category._id || product.category.id || "");
  }

  return "";
}

export function mapProduct(p: ApiProduct): Product {
  const variants = Array.isArray(p.variants)
    ? p.variants
        .map(normalizeVariant)
        .filter((v): v is ProductVariant => Boolean(v))
    : [];

  return {
    id: String(p._id || p.id || ""),
    name: String(p.name || "Untitled Product"),
    slug: String(p.slug || "-"),
    description: p.description || "",
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    status: normalizeStatus(p.status),
    image: String(p.image || ""),
    images: Array.isArray(p.images) ? p.images : [],
    gender: normalizeGender(p.gender),
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: normalizeSizes(p.sizes),
    variants,
    categoryId: getProductCategoryId(p),
  };
}

export function getProductArray(
  body: ProductListResponse | ApiProduct[]
): ApiProduct[] {
  if (Array.isArray(body)) return body;

  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.products)) return body.products;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.docs)) return body.docs;
  if (Array.isArray(body.result)) return body.result;

  if (body.data && Array.isArray(body.data.products)) return body.data.products;
  if (body.data && Array.isArray(body.data.items)) return body.data.items;
  if (body.data && Array.isArray(body.data.docs)) return body.data.docs;
  if (body.data && Array.isArray(body.data.result)) return body.data.result;
  if (body.data && Array.isArray(body.data.data)) return body.data.data;

  return [];
}

export function getCategoryArray(
  body: CategoryListResponse | ApiCategory[]
): ApiCategory[] {
  if (Array.isArray(body)) return body;

  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.categories)) return body.categories;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.docs)) return body.docs;
  if (Array.isArray(body.result)) return body.result;

  if (body.data && Array.isArray(body.data.categories)) {
    return body.data.categories;
  }

  if (body.data && Array.isArray(body.data.items)) return body.data.items;
  if (body.data && Array.isArray(body.data.docs)) return body.data.docs;
  if (body.data && Array.isArray(body.data.result)) return body.data.result;
  if (body.data && Array.isArray(body.data.data)) return body.data.data;

  return [];
}

export function emptyVariant(): ProductVariantForm {
  return {
    color: "#000000",
    size: "M",
    stock: "",
    sku: "",
    isActive: true,
  };
}

export function emptyForm() {
  return {
    name: "",
    description: "",
    price: "" as number | "",
    status: "Active" as ProductStatus,
    gender: "Male" as Gender,
    categoryId: "",
    image: "",
    images: "",
    variants: [emptyVariant()] as ProductVariantForm[],
  };
}

export function productVariantsToForm(
  product: Product
): ProductVariantForm[] {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.map((v) => ({
      id: v.id,
      color: v.color || "#000000",
      size: v.size || "M",
      stock: Number(v.stock || 0),
      sku: v.sku || "",
      isActive: v.isActive !== false,
    }));
  }

  const fallbackColor = product.colors?.[0] || "#000000";
  const fallbackSize = product.sizes?.[0] || "M";

  return [
    {
      color: fallbackColor,
      size: fallbackSize,
      stock: Number(product.stock || 0),
      sku: "",
      isActive: true,
    },
  ];
}

export function getVariantStats(product: Product) {
  const variants = product.variants || [];
  const variantCount = variants.length;

  const lowStockVariants = variants.filter(
    (variant) => variant.isActive && variant.stock > 0 && variant.stock <= 5
  ).length;

  const outOfStockVariants = variants.filter(
    (variant) => variant.isActive && variant.stock <= 0
  ).length;

  return {
    variantCount,
    lowStockVariants,
    outOfStockVariants,
  };
}

export function getTotalVariantStock(variants: ProductVariantForm[]) {
  return variants
    .filter((variant) => variant.isActive)
    .reduce((total, variant) => total + Number(variant.stock || 0), 0);
}

export function buildSku(name: string, color: string, size: Size) {
  const cleanName =
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 18) || "UFO-PRODUCT";

  const colorCode = color.replace("#", "").toUpperCase();

  return `${cleanName}-${colorCode}-${size}`;
}