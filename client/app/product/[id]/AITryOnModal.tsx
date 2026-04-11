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

type CameraFacingMode = "user" | "environment";

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

function getSourceLabel(source?: string) {
  switch ((source || "").toLowerCase()) {
    case "replicate":
      return "Replicate AI";
    case "huggingface":
      return "Hugging Face AI";
    case "demo":
      return "Preview Mode";
    default:
      return "AI";
  }
}

async function mirrorImageFile(file: File): Promise<File> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to read uploaded image."));
      el.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas is not supported in this browser.");
    }

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (output) => {
          if (!output) {
            reject(new Error("Failed to mirror image."));
            return;
          }
          resolve(output);
        },
        file.type || "image/jpeg",
        0.95
      );
    });

    const ext =
      file.name.includes(".")
        ? file.name.slice(file.name.lastIndexOf("."))
        : ".jpg";

    const mirroredName = file.name.replace(ext, "") + "-mirrored" + ext;

    return new File([blob], mirroredName, {
      type: blob.type || file.type || "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

function isProbablyMobileDevice() {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export default function AITryOnModal({
  open,
  onClose,
  productId,
  productName,
}: Props) {
  const abortRef = React.useRef<AbortController | null>(null);
  const progressTimerRef = React.useRef<number | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const [mirrorMode, setMirrorMode] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState("Generating...");
  const [loadingHint, setLoadingHint] = React.useState<string | null>(null);

  const [error, setError] = React.useState<string | null>(null);

  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [productPreview, setProductPreview] =
    React.useState<ProductPreview | null>(null);

  const [source, setSource] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [cameraLoading, setCameraLoading] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] =
    React.useState<CameraFacingMode>("user");
  const [cameraReady, setCameraReady] = React.useState(false);
  const [hasCameraSupport, setHasCameraSupport] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === "undefined") return;
    setHasCameraSupport(
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  const stopCamera = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError(null);
    setLoading(false);
    setLoadingText("Generating...");
    setLoadingHint(null);
    setProductPreview(null);
    setSource(null);
    setWarning(null);
    setMirrorMode(false);
    setCameraOpen(false);
    setCameraLoading(false);
    setCameraError(null);
    setCameraFacingMode(isProbablyMobileDevice() ? "user" : "user");
    setCameraReady(false);

    return () => {
      stopCamera();
    };
  }, [open, stopCamera]);

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
      if (e.key === "Escape" && !loading && !cameraLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading, cameraLoading]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (progressTimerRef.current) {
        window.clearTimeout(progressTimerRef.current);
      }
      stopCamera();
    };
  }, [stopCamera]);

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const resetTryOnState = () => {
    setError(null);
    setWarning(null);
    setSource(null);
    setResultUrl(null);
    setLoadingHint(null);
  };

  const validateImageFile = (selected: File | null) => {
    if (!selected) {
      return { ok: false, message: "" };
    }

    if (!selected.type.startsWith("image/")) {
      return { ok: false, message: "Please upload a valid image file." };
    }

    if (selected.size > 8 * 1024 * 1024) {
      return { ok: false, message: "Image size must be less than 8MB." };
    }

    return { ok: true, message: "" };
  };

  const setSelectedImageFile = (selected: File | null) => {
    const validation = validateImageFile(selected);

    if (!selected) {
      setFile(null);
      setError(null);
      return;
    }

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    resetTryOnState();
    setFile(selected);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setSelectedImageFile(selected);
  };

  const startCamera = React.useCallback(
    async (facingMode: CameraFacingMode) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported in this browser.");
        return;
      }

      try {
        setCameraLoading(true);
        setCameraError(null);
        setCameraReady(false);

        stopCamera();

        let stream: MediaStream;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 720 },
              height: { ideal: 960 },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await videoRef.current.play().catch(() => undefined);
          setCameraReady(true);
        }

        setCameraOpen(true);
      } catch (err: any) {
        console.error(err);

        if (err?.name === "NotAllowedError") {
          setCameraError("Camera permission was denied.");
        } else if (err?.name === "NotFoundError") {
          setCameraError("No camera was found on this device.");
        } else {
          setCameraError("Unable to access camera.");
        }

        setCameraOpen(false);
      } finally {
        setCameraLoading(false);
      }
    },
    [stopCamera]
  );

  const openCamera = async () => {
    resetTryOnState();
    setCameraFacingMode((prev) => prev || "user");
    await startCamera(cameraFacingMode);
  };

  const switchCamera = async () => {
    const nextMode: CameraFacingMode =
      cameraFacingMode === "user" ? "environment" : "user";
    setCameraFacingMode(nextMode);
    await startCamera(nextMode);
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraError(null);
    setCameraLoading(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) {
      setCameraError("Camera preview is not ready.");
      return;
    }

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 960;

    if (!width || !height) {
      setCameraError("Camera preview is not ready.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Canvas is not supported in this browser.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.95);
    });

    if (!blob) {
      setCameraError("Failed to capture camera image.");
      return;
    }

    const capturedFile = new File([blob], `camera-capture-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    setSelectedImageFile(capturedFile);
    closeCamera();
  };

  const retakePhoto = async () => {
    setFile(null);
    setPreviewUrl(null);
    resetTryOnState();
    await startCamera(cameraFacingMode);
  };

  const runTryOn = async () => {
    if (!file) {
      setError("Please upload or capture a clear front-facing photo.");
      return;
    }

    if (loading) return;

    clearProgressTimer();

    try {
      setLoading(true);
      setLoadingText("Preparing image...");
      setLoadingHint("Checking your upload and getting everything ready.");
      setError(null);
      setWarning(null);
      setSource(null);
      setResultUrl(null);

      let uploadFile = file;

      if (mirrorMode) {
        setLoadingText("Applying mirror mode...");
        setLoadingHint("Flipping your uploaded image before sending it to AI.");
        uploadFile = await mirrorImageFile(file);
      }

      const fd = new FormData();
      fd.append("personImage", uploadFile);
      fd.append("productId", productId);
      fd.append("mirrorMode", String(mirrorMode));

      const controller = new AbortController();
      abortRef.current = controller;

      const timeout = window.setTimeout(() => {
        controller.abort();
      }, 120000);

      setLoadingText("Starting AI try-on...");
      setLoadingHint("Trying the fastest available provider first.");

      progressTimerRef.current = window.setTimeout(() => {
        setLoadingText("Generating with AI...");
        setLoadingHint(
          "This usually takes a little time for cloth fitting and image rendering."
        );
      }, 2500);

      const res = await fetch(`${API_BASE}/ai/tryon`, {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      window.clearTimeout(timeout);
      clearProgressTimer();

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        throw new Error(data?.message || "AI try-on failed.");
      }

      const out = data?.imageUrl || data?.outputUrl || data?.resultUrl;
      if (!out) {
        throw new Error("AI output missing.");
      }

      setLoadingText("Finalizing result...");
      setLoadingHint("Your generated preview is almost ready.");

      setResultUrl(getImageUrl(String(out)));
      setSource(typeof data?.source === "string" ? data.source : null);
      setWarning(typeof data?.warning === "string" ? data.warning : null);
    } catch (e: any) {
      clearProgressTimer();

      if (e?.name === "AbortError") {
        setError("AI try-on took too long. Please try again.");
      } else {
        setError(e?.message || "Failed to generate try-on image.");
      }
    } finally {
      abortRef.current = null;
      clearProgressTimer();
      setLoading(false);
      setLoadingText("Generating...");
      setLoadingHint(null);
    }
  };

  if (!open) return null;

  const productImg = productPreview?.image || "/product-boy-main.png";
  const productTitle = productPreview?.name || productName;
  const previewIsFrontCameraMirror = cameraOpen && cameraFacingMode === "user";
  const canSwitchCamera = hasCameraSupport;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI Try On Modal"
    >
      <button
        type="button"
        onClick={() => {
          if (!loading && !cameraLoading) {
            closeCamera();
            onClose();
          }
        }}
        className="absolute inset-0 bg-black/70"
        aria-label="Close modal overlay"
      />

      <div className="relative z-[101] w-full max-w-[1120px] rounded-[16px] border border-[#1f2a44] bg-[#050816] text-white shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#111827] px-5 py-4">
          <div>
            <div className="text-[15px] font-semibold">Try On with AI</div>
            <div className="text-[12px] text-[#9ca3af]">
              Product: <span className="text-white">{productTitle}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!loading && !cameraLoading) {
                closeCamera();
                onClose();
              }
            }}
            disabled={loading || cameraLoading}
            className="rounded-full border border-[#2b2f45] px-3 py-2 text-[12px] text-[#e5e7eb] transition hover:bg-white hover:text-[#050611] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.15fr_0.85fr_1fr]">
          <div className="rounded-[14px] border border-[#111827] bg-[#0b0f1a]/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-white">
                  1) Upload or capture your photo
                </div>
                <div className="mt-1 text-[12px] text-[#9ca3af]">
                  Use a clear, front-facing photo with good lighting.
                </div>
              </div>

              {cameraOpen ? (
                <span className="rounded-full border border-[#1d4f77] bg-[#0b1b30] px-3 py-1 text-[11px] text-[#bfdbfe]">
                  Camera On
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block cursor-pointer rounded-[12px] border border-[#2b2f45] bg-[#050816] p-4 text-center transition hover:bg-[#0b0f1a]/60">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                  disabled={loading || cameraLoading}
                />
                <div className="text-[12px] font-medium text-[#cbd5e1]">
                  {file ? "Change selected image" : "Upload image"}
                </div>
              </label>

              <button
                type="button"
                onClick={openCamera}
                disabled={!hasCameraSupport || loading || cameraLoading}
                className="rounded-[12px] border border-[#2b2f45] bg-[#050816] p-4 text-[12px] font-medium text-[#cbd5e1] transition hover:bg-[#0b0f1a]/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cameraOpen ? "Restart camera" : "Use camera"}
              </button>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-[12px] border border-[#111827] bg-[#050816] p-3">
              <input
                type="checkbox"
                checked={mirrorMode}
                onChange={(e) => setMirrorMode(e.target.checked)}
                className="h-4 w-4"
                disabled={loading}
              />
              <div>
                <div className="text-[12px] font-medium text-white">
                  Mirror Mode
                </div>
                <div className="text-[11px] text-[#9ca3af]">
                  Flip the final uploaded or captured image before sending it to AI.
                </div>
              </div>
            </label>

            {cameraOpen ? (
              <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827] bg-[#050816]">
                <div className="relative h-[300px] w-full bg-black sm:h-[360px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`h-full w-full object-cover ${
                      previewIsFrontCameraMirror ? "scale-x-[-1]" : ""
                    }`}
                  />

                  {(cameraLoading || !cameraReady) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-4 text-center">
                      <Spinner />
                      <div className="text-[13px] font-medium text-white">
                        Opening camera...
                      </div>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white">
                    {cameraFacingMode === "user"
                      ? "Front camera"
                      : "Back camera"}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-[#111827] p-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={switchCamera}
                    disabled={!canSwitchCamera || loading || cameraLoading}
                    className="rounded-[10px] border border-[#2b2f45] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-white hover:text-[#050611] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Switch Camera
                  </button>

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!cameraReady || loading || cameraLoading}
                    className="rounded-[10px] bg-[#1d9bf0] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-[#1580c5] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#cbd5e1]"
                  >
                    Capture Photo
                  </button>

                  <button
                    type="button"
                    onClick={closeCamera}
                    disabled={loading || cameraLoading}
                    className="rounded-[10px] border border-[#2b2f45] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-white hover:text-[#050611] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Close Camera
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827]">
                <div className="relative h-[300px] w-full bg-[#050816] sm:h-[360px]">
                  <Image
                    src={previewUrl}
                    alt="Person preview"
                    fill
                    className={`object-cover ${mirrorMode ? "scale-x-[-1]" : ""}`}
                    unoptimized
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-[#111827] p-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={retakePhoto}
                    disabled={loading || cameraLoading}
                    className="rounded-[10px] border border-[#2b2f45] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-white hover:text-[#050611] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retake with Camera
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                      resetTryOnState();
                    }}
                    disabled={loading || cameraLoading}
                    className="rounded-[10px] border border-[#2b2f45] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-white hover:text-[#050611] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[12px] border border-dashed border-[#243041] bg-[#050816] p-6 text-center text-[12px] text-[#9ca3af]">
                Upload an image or open the camera to preview your photo here.
              </div>
            )}

            {cameraError ? (
              <div className="mt-3 rounded-[10px] border border-red-500/40 bg-red-500/10 p-3 text-[12px] text-red-200">
                {cameraError}
              </div>
            ) : null}

            {!hasCameraSupport ? (
              <div className="mt-3 rounded-[10px] border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">
                Camera is not supported in this browser. Please use image upload.
              </div>
            ) : null}

            <div className="mt-4 rounded-[12px] border border-[#111827] bg-[#050816] p-3 text-[11px] leading-5 text-[#94a3b8]">
              Best results usually come from a standing, front-facing photo with the upper body clearly visible. On mobile, you can switch between front and back camera. On desktop, the browser will use the available webcam.
            </div>
          </div>

          <div className="rounded-[14px] border border-[#111827] bg-[#0b0f1a]/50 p-4">
            <div className="text-[13px] font-semibold text-white">
              2) Selected product
            </div>
            <div className="mt-1 text-[12px] text-[#9ca3af]">
              This product will be used for AI try-on.
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827] bg-[#050816] p-4">
              <div className="relative h-[280px] w-full">
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
              disabled={loading || !file || cameraOpen}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-[13px] font-semibold transition ${
                loading || !file || cameraOpen
                  ? "cursor-not-allowed bg-[#334155] text-[#cbd5e1]"
                  : "bg-[#1d9bf0] text-white hover:bg-[#1580c5]"
              }`}
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>{loadingText}</span>
                </>
              ) : (
                "Generate Try-On"
              )}
            </button>

            {cameraOpen ? (
              <div className="mt-3 rounded-[10px] border border-[#1d4f77] bg-[#0b1b30] p-3 text-[12px] text-[#bfdbfe]">
                Capture your photo first, then generate the AI try-on result.
              </div>
            ) : null}

            {loadingHint ? (
              <div className="mt-3 rounded-[10px] border border-[#1d4f77] bg-[#0b1b30] p-3 text-[12px] text-[#bfdbfe]">
                {loadingHint}
              </div>
            ) : null}

            {error ? (
              <div className="mt-3 rounded-[10px] border border-red-500/40 bg-red-500/10 p-3 text-[12px] text-red-200">
                {error}
              </div>
            ) : null}

            {warning ? (
              <div className="mt-3 rounded-[10px] border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-200">
                {warning}
              </div>
            ) : null}
          </div>

          <div className="rounded-[14px] border border-[#111827] bg-[#0b0f1a]/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-white">
                  3) AI result
                </div>
                <div className="mt-1 text-[12px] text-[#9ca3af]">
                  Your generated try-on image will appear here.
                </div>
              </div>

              {source ? (
                <span className="rounded-full border border-[#2b2f45] px-3 py-1 text-[11px] font-medium text-[#cbd5e1]">
                  {getSourceLabel(source)}
                </span>
              ) : null}
            </div>

            <div className="mt-4 overflow-hidden rounded-[12px] border border-[#111827] bg-[#050816]">
              {resultUrl ? (
                <div className="relative h-[380px] w-full">
                  <Image
                    src={resultUrl}
                    alt="AI try-on result"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : loading ? (
                <div className="flex h-[380px] flex-col items-center justify-center gap-3 p-6 text-center">
                  <Spinner />
                  <div className="text-[13px] font-medium text-white">
                    {loadingText}
                  </div>
                  <div className="max-w-[260px] text-[12px] leading-5 text-[#9ca3af]">
                    {loadingHint ||
                      "Please wait while your AI result is being created."}
                  </div>
                </div>
              ) : (
                <div className="flex h-[380px] items-center justify-center p-6 text-center text-[12px] text-[#9ca3af]">
                  No result yet. Add your photo and click{" "}
                  <span className="ml-1 font-semibold text-white">
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
                className="mt-4 inline-flex w-full items-center justify-center rounded-[10px] border border-[#2b2f45] px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-white hover:text-[#050611]"
              >
                Open Result
              </a>
            ) : (
              <div className="mt-4 rounded-[10px] border border-dashed border-[#243041] px-4 py-3 text-center text-[12px] text-[#64748b]">
                Generated result will appear here.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#111827] px-5 py-4 text-[12px] text-[#9ca3af]">
          Privacy note: user photos are used only for processing and can be deleted after generation.
        </div>
      </div>
    </div>
  );
}