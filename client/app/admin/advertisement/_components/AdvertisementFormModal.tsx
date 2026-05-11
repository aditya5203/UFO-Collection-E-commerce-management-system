"use client";

import * as React from "react";
import {
  AdPosition,
  AdType,
  Audience,
  inputClassName,
  optionClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./advertisementTypes";
import { AlertBox } from "./AdvertisementShared";

type Props = {
  isEdit: boolean;
  saving: boolean;
  formError: string;
  setFormError: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
  setTitle: (value: string) => void;
  adType: AdType;
  setAdType: (value: AdType) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  formAudience: Audience;
  setFormAudience: (value: Audience) => void;
  position: AdPosition;
  setPosition: (value: AdPosition) => void;
  priority: number;
  setPriority: (value: number) => void;
  clickUrl: string;
  setClickUrl: (value: string) => void;
  mediaKind: "image" | "video";
  setMediaKind: (value: "image" | "video") => void;
  file: File | null;
  setFile: (value: File | null) => void;
  files: File[];
  setFiles: (value: File[]) => void;
  isCarouselImages: boolean;
};

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

export default function AdvertisementFormModal({
  isEdit,
  saving,
  formError,
  setFormError,
  onClose,
  onSave,
  title,
  setTitle,
  adType,
  setAdType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  formAudience,
  setFormAudience,
  position,
  setPosition,
  priority,
  setPriority,
  clickUrl,
  setClickUrl,
  mediaKind,
  setMediaKind,
  file,
  setFile,
  files,
  setFiles,
  isCarouselImages,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#26293a] px-5 py-4">
          <div>
            <div id="ad-modal-title" className="text-[18px] font-semibold text-white">
              {isEdit ? "Edit Advertisement" : "Create Advertisement"}
            </div>

            <div className="mt-1 text-[13px] text-[#a7aec4]">
              Connected to API + Cloudinary upload.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {formError ? (
            <AlertBox
              type="error"
              message={formError}
              onClose={() => setFormError("")}
            />
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Ad Title" htmlFor="ad-title">
              <input
                id="ad-title"
                name="adTitle"
                title="Ad Title"
                aria-label="Ad Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dashain Offer"
                className={inputClassName()}
              />
            </Field>

            <Field label="Type" htmlFor="ad-type">
              <select
                id="ad-type"
                name="adType"
                title="Advertisement type"
                aria-label="Advertisement type"
                value={adType}
                onChange={(e) => setAdType(e.target.value as AdType)}
                className={inputClassName()}
              >
                <option className={optionClass()}>Banner</option>
                <option className={optionClass()}>Carousel</option>
                <option className={optionClass()}>Pop-up</option>
                <option className={optionClass()}>Video</option>
              </select>
            </Field>

            <Field label="Start Date" htmlFor="ad-start-date">
              <input
                id="ad-start-date"
                name="adStartDate"
                title="Advertisement start date"
                aria-label="Advertisement start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClassName()}
              />
            </Field>

            <Field label="End Date" htmlFor="ad-end-date">
              <input
                id="ad-end-date"
                name="adEndDate"
                title="Advertisement end date"
                aria-label="Advertisement end date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClassName()}
              />
            </Field>

            <Field label="Audience" htmlFor="ad-audience">
              <select
                id="ad-audience"
                name="adAudience"
                title="Advertisement audience"
                aria-label="Advertisement audience"
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value as Audience)}
                className={inputClassName()}
              >
                <option className={optionClass()}>All Customers</option>
                <option className={optionClass()}>New Customers</option>
                <option className={optionClass()}>Returning Customers</option>
              </select>
            </Field>

            <Field label="Placement" htmlFor="ad-placement">
              <select
                id="ad-placement"
                name="adPlacement"
                title="Advertisement placement"
                aria-label="Advertisement placement"
                value={position}
                onChange={(e) => setPosition(e.target.value as AdPosition)}
                className={inputClassName()}
              >
                <option className={optionClass()}>Home Top</option>
                <option className={optionClass()}>Home Mid</option>
                <option className={optionClass()}>Home Bottom</option>
                <option className={optionClass()}>Category Top</option>
                <option className={optionClass()}>Product Page</option>
              </select>
            </Field>

            <Field label="Priority" htmlFor="ad-priority">
              <input
                id="ad-priority"
                name="adPriority"
                title="Advertisement priority"
                aria-label="Advertisement priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={1}
                className={inputClassName()}
              />
            </Field>

            <Field label="Click URL" htmlFor="ad-click-url">
              <input
                id="ad-click-url"
                name="adClickUrl"
                title="Advertisement click URL"
                aria-label="Advertisement click URL"
                value={clickUrl}
                onChange={(e) => setClickUrl(e.target.value)}
                placeholder="/collection or https://..."
                className={inputClassName()}
              />
            </Field>

            <div className="md:col-span-2">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                  Upload Media
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Media Kind" htmlFor="ad-media-kind">
                    <select
                      id="ad-media-kind"
                      name="adMediaKind"
                      title="Advertisement media kind"
                      aria-label="Advertisement media kind"
                      value={mediaKind}
                      onChange={(e) =>
                        setMediaKind(e.target.value as "image" | "video")
                      }
                      className={inputClassName()}
                    >
                      <option value="image" className={optionClass()}>
                        image
                      </option>
                      <option value="video" className={optionClass()}>
                        video
                      </option>
                    </select>

                    {adType === "Carousel" && mediaKind === "video" ? (
                      <div className="mt-2 text-[12px] text-amber-300">
                        Carousel + video is not recommended. Use Type=Video for
                        video ads.
                      </div>
                    ) : null}
                  </Field>

                  <Field
                    label={
                      isCarouselImages ? "Choose Images (Multiple)" : "Choose File"
                    }
                    htmlFor="ad-media-upload"
                  >
                    <input
                      id="ad-media-upload"
                      name="adMediaUpload"
                      title="Upload advertisement media"
                      aria-label="Upload advertisement media"
                      type="file"
                      accept={isCarouselImages ? "image/*" : "image/*,video/*"}
                      multiple={isCarouselImages}
                      onChange={(e) => {
                        const list = Array.from(e.target.files || []);

                        if (isCarouselImages) {
                          setFiles(list);
                          setFile(null);
                        } else {
                          setFile(list[0] ?? null);
                          setFiles([]);
                        }
                      }}
                      className="block w-full text-[12px] text-[#a7aec4] file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-[12px] file:font-semibold file:text-[#090a12] hover:file:bg-white/90"
                    />

                    <div className="mt-2 text-[12px] text-[#7f879f]">
                      {isEdit
                        ? "Optional: upload new file(s) to replace existing media."
                        : isCarouselImages
                          ? "Required: upload 1+ images for Carousel."
                          : "Required: upload image/video before saving."}
                    </div>

                    {isCarouselImages && files.length ? (
                      <div className="mt-2 text-[12px] text-[#a7aec4]">
                        Selected:{" "}
                        <span className="font-semibold text-white">
                          {files.length}
                        </span>{" "}
                        images
                      </div>
                    ) : null}

                    {!isCarouselImages && file ? (
                      <div className="mt-2 text-[12px] text-[#a7aec4]">
                        Selected:{" "}
                        <span className="font-semibold text-white">
                          {file.name}
                        </span>
                      </div>
                    ) : null}
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={secondaryBtnClass}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className={primaryBtnClass}
          >
            {saving ? "Saving..." : "Save Advertisement"}
          </button>
        </div>
      </div>
    </div>
  );
}