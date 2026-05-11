"use client";

export default function AttachmentPreviewModal({
  attachmentPreview,
  onClose,
}: {
  attachmentPreview: string | null;
  onClose: () => void;
}) {
  if (!attachmentPreview) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[4px]">
      <div className="relative w-full max-w-[1100px] overflow-hidden rounded-[26px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
        <div className="flex items-center justify-between border-b border-[#26293a] px-5 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
              Attachment Preview
            </div>

            <div className="mt-1 text-[18px] font-semibold text-white">
              Support Ticket Image
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Close attachment preview"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[78vh] overflow-auto bg-[#0d0f17] p-4">
          <img
            src={attachmentPreview}
            alt="Fullscreen ticket attachment"
            className="mx-auto max-h-[72vh] w-auto max-w-full rounded-[18px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}