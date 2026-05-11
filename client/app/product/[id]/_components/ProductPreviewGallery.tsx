"use client";

import * as React from "react";
import Image from "next/image";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

function PreviewTransformLayer({
  pan,
  zoomLevel,
  children,
}: {
  pan: { x: number; y: number };
  zoomLevel: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    ref.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`;
    ref.current.style.transformOrigin = "center center";
  }, [pan.x, pan.y, zoomLevel]);

  return (
    <div
      ref={ref}
      className="relative h-full w-full transition-transform duration-200 ease-out"
    >
      {children}
    </div>
  );
}

export default function ProductPreviewGallery({
  productName,
  currentImage,
  allImages,
  currentImageIndex,
  isOutOfStock,
  zoomLevel,
  pan,
  dragging,
  onPrev,
  onNext,
  onZoomOut,
  onZoomIn,
  onReset,
  onSelectImage,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onWheel,
  onDoubleClick,
}: {
  productName: string;
  currentImage: string;
  allImages: string[];
  currentImageIndex: number;
  isOutOfStock: boolean;
  zoomLevel: number;
  pan: { x: number; y: number };
  dragging: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
  onSelectImage: (img: string) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
}) {
  return (
    <div className={`${panelClass} h-fit p-4 sm:p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a7aec4]">
            Live Product Preview
          </div>

          <p className="mt-1 text-[12px] text-[#a7aec4]">
            Double click to zoom • Drag to explore • Swipe left/right
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["Prev", onPrev],
            ["Next", onNext],
            ["-", onZoomOut],
            ["+", onZoomIn],
            ["Reset", onReset],
          ].map(([label, action]) => (
            <button
              key={String(label)}
              type="button"
              onClick={action as () => void}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10"
            >
              {String(label)}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-[#26293a] bg-[#0d0f17] ${
          zoomLevel > 1
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-zoom-in"
        } ${dragging ? "select-none" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerLeave}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          🔍 Zoom {Math.round(zoomLevel * 100)}%
        </div>

        <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {currentImageIndex + 1} / {allImages.length || 1}
        </div>

        {isOutOfStock ? (
          <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-100 backdrop-blur">
            Out of Stock
          </div>
        ) : null}

        <PreviewTransformLayer pan={pan} zoomLevel={zoomLevel}>
          <Image
            src={currentImage}
            alt={productName}
            fill
            className={`select-none object-cover object-top ${
              isOutOfStock ? "opacity-60 grayscale" : ""
            }`}
            priority
            draggable={false}
            unoptimized={currentImage.startsWith("http")}
          />
        </PreviewTransformLayer>
      </div>

      {allImages.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {allImages.map((img, index) => {
            const active = currentImage === img;

            return (
              <button
                key={`${img}-${index}`}
                type="button"
                aria-label={`View product image ${index + 1}`}
                title={`View product image ${index + 1}`}
                onClick={() => onSelectImage(img)}
                className={`relative h-[76px] w-[76px] overflow-hidden rounded-[14px] border transition ${
                  active
                    ? "border-[#d6c7ff] ring-2 ring-[#d6c7ff]/25"
                    : "border-[#26293a] hover:border-[#4a506b]"
                }`}
              >
                <Image
                  src={img}
                  alt={`${productName} ${index + 1}`}
                  fill
                  className={`object-cover ${
                    isOutOfStock ? "opacity-60 grayscale" : ""
                  }`}
                  unoptimized={img.startsWith("http")}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}