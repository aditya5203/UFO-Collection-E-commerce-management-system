"use client";

import * as React from "react";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type Props = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
};

type ProductPreview = {
  image?: string;
  name?: string;
};

function getImageUrl(src?: string) {
  const value = typeof src === "string" ? src.trim() : "";
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const base = API_BASE.replace(/\/api$/, "");

  if (value.startsWith("/uploads/")) return `${base}${value}`;
  if (value.startsWith("uploads/")) return `${base}/${value}`;
  if (value.startsWith("/images/")) return value;

  return value;
}

export default function AITryOnModal({
  open,
  onClose,
  productId,
  productName,
}: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [productPreview, setProductPreview] =
    React.useState<ProductPreview | null>(null);

  React.useEffect(() => {
    if (!open) return;

    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    setLoading(false);
    setProductPreview(null);
  }, [open]);

  React.useEffect(() => {
    if (!open || !productId) return;

    let ignore = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          throw new Error(json?.message || "Failed to load product preview");
        }

        const raw = json?.data ?? json;

        if (ignore) return;

        setProductPreview({
          image: getImageUrl(raw?.image || raw?.images?.[0] || ""),
          name: raw?.name || productName,
        });
      } catch {
        if (!ignore) {
          setProductPreview({
            image: "",
            name: productName,
          });
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [open, productId, productName]);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;

    if (!selected) {
      setFile(null);
      setError(null);
      return;
    }

    if (!selected.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    if (selected.size > 8 * 1024 * 1024) {
      setError("Image size must be less than 8MB.");
      return;
    }

    setError(null);
    setFile(selected);
  };

  const runTryOn = async () => {
    if (!file) {
      setError("Please upload a clear front-facing photo.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      setResultUrl(null);

      const fd = new FormData();
      fd.append("personImage", file);
      fd.append("productId", productId);

      const res = await fetch(`${API_BASE}/ai/tryon`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        throw new Error(data?.message || "AI try-on failed.");
      }

      const out = data?.imageUrl || data?.outputUrl || data?.resultUrl;
      if (!out) {
        throw new Error("AI output missing.");
      }

      setResultUrl(getImageUrl(String(out)));
    } catch (e: any) {
      setError(e?.message || "Failed to generate try-on image.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const productImg = productPreview?.image || "/product-boy-main.png";
  const productTitle = productPreview?.name || productName;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI Try On Modal"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
        aria-label="Close modal overlay"
      />

      <div className="relative z-[101] w-full max-w-[980px] rounded-[16px] border border-[#1f2a44] bg-[#050816] text-white shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#111827] px-5 py-4">
          <div>
            <div className="text-[15px] font-semibold">Try On with AI</div>
            <div className="text-[12px] text-[#9ca3af]">
              Product: <span className="text-white">{productTitle}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2b2f45] px-3 py-2 text-[12px] text-[#e5e7eb] hover:bg-white hover:text-[#050611]"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[1fr_1fr_1fr]">
          <div className="rounded-[14px] border border-[#111827] bg-[#0b0f1a]/50 p-4">
            <div className="text-[13px] font-semibold text-white">
              1) Upload your photo
            </div>
            <div className="mt-1 text-[12px] text-[#9ca3af]">
              Use a clear, front-facing photo with good lighting.
            </div>

            <label className="mt-4 block cursor-pointer rounded-[12px] border border-[#2b2f45] bg-[#050816] p-4 hover:bg-[#0b0f1a]/60">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <div className="text-[12px] text-[#cbd5e1]">
                Click to choose image
              </div>
            </label>

            {previewUrl ? (
              <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827]">
                <div className="relative h-[240px] w-full">
                  <Image
                    src={previewUrl}
                    alt="Person preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[12px] border border-[#111827] bg-[#050816] p-4 text-[12px] text-[#9ca3af]">
                No image selected.
              </div>
            )}
          </div>

          <div className="rounded-[14px] border border-[#111827] bg-[#0b0f1a]/50 p-4">
            <div className="text-[13px] font-semibold text-white">
              2) Selected product
            </div>
            <div className="mt-1 text-[12px] text-[#9ca3af]">
              This product will be used for AI try-on.
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827] bg-[#050816] p-4">
              <div className="relative h-[260px] w-full">
                <Image
                  src={productImg}
                  alt={productTitle}
                  fill
                  className="object-contain"
                  unoptimized={productImg.startsWith("http")}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={runTryOn}
              disabled={loading}
              className={`mt-4 w-full rounded-[10px] px-4 py-3 text-[13px] font-semibold ${
                loading
                  ? "cursor-not-allowed bg-[#334155] text-[#cbd5e1]"
                  : "bg-[#1d9bf0] text-white hover:bg-[#1580c5]"
              }`}
            >
              {loading ? "Generating..." : "Generate Try-On"}
            </button>

            {error ? (
              <div className="mt-3 rounded-[10px] border border-red-500/40 bg-red-500/10 p-3 text-[12px] text-red-200">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-[#111827] bg-[#0b0f1a]/50 p-4">
            <div className="text-[13px] font-semibold text-white">
              3) AI result
            </div>
            <div className="mt-1 text-[12px] text-[#9ca3af]">
              Your generated try-on image will appear here.
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827] bg-[#050816]">
              {resultUrl ? (
                <div className="relative h-[360px] w-full">
                  <Image
                    src={resultUrl}
                    alt="AI try-on result"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="p-4 text-[12px] text-[#9ca3af]">
                  No result yet. Click{" "}
                  <span className="font-semibold text-white">
                    Generate Try-On
                  </span>
                  .
                </div>
              )}
            </div>

            {resultUrl ? (
              <a
                href={resultUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-[10px] border border-[#2b2f45] px-4 py-3 text-[13px] font-semibold text-white hover:bg-white hover:text-[#050611]"
              >
                Open Result
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#111827] px-5 py-4 text-[12px] text-[#9ca3af]">
          Privacy note: user photos are used only for processing and can be deleted after generation.
        </div>
      </div>
    </div>
  );
}