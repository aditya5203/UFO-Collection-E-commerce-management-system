"use client";

import * as React from "react";
import Image from "next/image";
import {
  Gender,
  ProductStatus,
  ProductVariantForm,
  Size,
  getImageSrc,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./productTypes";
import {
  Field,
  UploadBox,
  VariantInventoryEditor,
} from "./ProductShared";

type CategoryOption = {
  id: string;
  name: string;
};

type Props = {
  showModal: boolean;
  editingId: string | null;

  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  price: number | "";
  setPrice: (value: number | "") => void;
  status: ProductStatus;
  setStatus: (value: ProductStatus) => void;
  gender: Gender;
  setGender: (value: Gender) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;

  categories: CategoryOption[];
  variants: ProductVariantForm[];
  submitting: boolean;

  mainFileRef: React.RefObject<HTMLInputElement | null>;
  galleryFileRef: React.RefObject<HTMLInputElement | null>;
  mainPreview: string | null;
  galleryPreview: string[];

  totalVariantStock: number;

  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleMainFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGalleryFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  addVariant: () => void;
  removeVariant: (index: number) => void;
  updateVariant: (index: number, patch: Partial<ProductVariantForm>) => void;
  generateVariantSku: (index: number) => void;

  onClose: () => void;
};

export default function ProductModal({
  showModal,
  editingId,
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  status,
  setStatus,
  gender,
  setGender,
  categoryId,
  setCategoryId,
  categories,
  variants,
  submitting,
  mainFileRef,
  galleryFileRef,
  mainPreview,
  galleryPreview,
  totalVariantStock,
  handleSubmit,
  handleMainFileChange,
  handleGalleryFilesChange,
  addVariant,
  removeVariant,
  updateVariant,
  generateVariantSku,
  onClose,
}: Props) {
  if (!showModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[92vh] w-[min(980px,94vw)] flex-col overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between border-b border-[#26293a] px-5 py-5 sm:px-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
              {editingId ? "Update" : "Create"}
            </div>

            <div className="mt-1 text-[22px] font-semibold text-white">
              {editingId ? "Edit Product" : "Add Product"}
            </div>

            <div className="mt-1 text-[12px] text-[#7f879f]">
              Total stock from active variants:{" "}
              <span className="font-semibold text-[#d6c7ff]">
                {totalVariantStock}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-[22px] text-[#a7aec4] transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Close product modal"
            title="Close product modal"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Name *" htmlFor="product-name">
              <input
                id="product-name"
                name="productName"
                title="Product name"
                aria-label="Product name"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="Description" htmlFor="product-description">
              <textarea
                id="product-description"
                name="productDescription"
                title="Product description"
                aria-label="Product description"
                className="min-h-[110px] w-full resize-none rounded-[16px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-[13px] leading-6 text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Price (Rs) *" htmlFor="product-price">
                <input
                  id="product-price"
                  name="productPrice"
                  title="Product price"
                  aria-label="Product price"
                  type="number"
                  min={0}
                  className={inputClass}
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                />
              </Field>

              <Field label="Auto Total Stock" htmlFor="product-stock">
                <input
                  id="product-stock"
                  name="productStock"
                  title="Total stock from variants"
                  aria-label="Total stock from variants"
                  type="number"
                  min={0}
                  className={`${inputClass} cursor-not-allowed text-[#d6c7ff]`}
                  value={totalVariantStock}
                  readOnly
                />
              </Field>

              <Field label="Status" htmlFor="product-status">
                <select
                  id="product-status"
                  name="productStatus"
                  title="Product status"
                  aria-label="Product status"
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Gender *" htmlFor="product-gender">
                <select
                  id="product-gender"
                  name="productGender"
                  title="Product gender"
                  aria-label="Product gender"
                  className={inputClass}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </Field>

              <Field label="Category *" htmlFor="product-category">
                <select
                  id="product-category"
                  name="productCategory"
                  title="Product category"
                  aria-label="Product category"
                  className={inputClass}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select category</option>

                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <VariantInventoryEditor
              variants={variants}
              name={name}
              onAdd={addVariant}
              onRemove={removeVariant}
              onChange={updateVariant}
              onGenerateSku={generateVariantSku}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <UploadBox
                title="Main Image *"
                description="Click to upload a local image."
                onClick={() => mainFileRef.current?.click()}
              >
                <input
                  ref={mainFileRef}
                  id="main-product-image"
                  name="mainProductImage"
                  title="Main product image"
                  aria-label="Main product image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleMainFileChange}
                />

                {mainPreview ? (
                  <div className="relative mt-4 h-[96px] w-[96px] overflow-hidden rounded-[18px] border border-white/10 bg-[#0d0f17]">
                    <Image
                      src={getImageSrc(mainPreview)}
                      alt="Main product preview"
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
              </UploadBox>

              <UploadBox
                title="Gallery Images"
                description="Upload one or more optional images."
                onClick={() => galleryFileRef.current?.click()}
              >
                <input
                  ref={galleryFileRef}
                  id="gallery-product-images"
                  name="galleryProductImages"
                  title="Gallery product images"
                  aria-label="Gallery product images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleGalleryFilesChange}
                />

                {galleryPreview.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {galleryPreview.map((src, idx) => (
                      <div
                        key={`${src}-${idx}`}
                        className="relative h-[72px] w-[72px] overflow-hidden rounded-[14px] border border-white/10 bg-[#0d0f17]"
                      >
                        <Image
                          src={getImageSrc(src)}
                          alt={`Gallery preview ${idx + 1}`}
                          fill
                          sizes="72px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </UploadBox>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className={secondaryBtnClass}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={primaryBtnClass}
              >
                {submitting
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}