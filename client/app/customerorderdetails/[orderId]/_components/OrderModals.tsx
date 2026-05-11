"use client";

type ReturnRequestType =
  | "RETURN_REFUND"
  | "EXCHANGE"
  | "DAMAGED"
  | "WRONG_ITEM"
  | "SIZE_COLOR_ISSUE"
  | "NOT_SATISFIED"
  | "OTHER";

type PreferredResolution = "REFUND" | "EXCHANGE";

type RefundDetailsDraft = {
  method: "BANK" | "KHALTI" | "ESEWA" | "FONEPAY";
  accountName: string;
  accountNumber: string;
  bankName: string;
  walletNumber: string;
  walletId: string;
  customerNote: string;
};

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function OrderModals({
  order,
  orderIdFromUrl,
  requestModal,
  requestReason,
  setRequestReason,
  requestType,
  setRequestType,
  preferredResolution,
  setPreferredResolution,
  requestSaving,
  requestError,
  closeRequestModal,
  submitOrderRequest,
  refundModalOpen,
  refundDraft,
  setRefundDraft,
  refundSaving,
  refundError,
  closeRefundModal,
  submitRefundDetails,
  reviewOpen,
  draft,
  setDraft,
  reviewSaving,
  reviewError,
  reviewOk,
  closeReviewModal,
  submitReview,
}: {
  order: any;
  orderIdFromUrl: string;
  requestModal: "cancel" | "return" | null;
  requestReason: string;
  setRequestReason: (value: string) => void;
  requestType: ReturnRequestType;
  setRequestType: (value: ReturnRequestType) => void;
  preferredResolution: PreferredResolution;
  setPreferredResolution: (value: PreferredResolution) => void;
  requestSaving: boolean;
  requestError: string | null;
  closeRequestModal: () => void;
  submitOrderRequest: () => void;
  refundModalOpen: boolean;
  refundDraft: RefundDetailsDraft;
  setRefundDraft: (value: RefundDetailsDraft) => void;
  refundSaving: boolean;
  refundError: string | null;
  closeRefundModal: () => void;
  submitRefundDetails: () => void;
  reviewOpen: boolean;
  draft: any;
  setDraft: (value: any) => void;
  reviewSaving: boolean;
  reviewError: string | null;
  reviewOk: string | null;
  closeReviewModal: () => void;
  submitReview: () => void;
}) {
  return (
    <>
      {requestModal ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Cancellation or return request modal"
        >
          <button
            type="button"
            onClick={closeRequestModal}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close modal backdrop"
            title="Close"
          />

          <div
            className={`${panelClass} relative max-h-[90vh] w-full max-w-[620px] overflow-y-auto p-6 sm:p-7`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  {requestModal === "cancel"
                    ? "Cancellation Request"
                    : "Return / Exchange Request"}
                </div>

                <div className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  {requestModal === "cancel"
                    ? "Request Order Cancellation"
                    : "Request Return, Refund or Exchange"}
                </div>

                <div className="mt-2 text-xs text-[#a7aec4]">
                  Order: {order?.orderId || orderIdFromUrl}
                </div>
              </div>

              <button
                type="button"
                onClick={closeRequestModal}
                disabled={requestSaving}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            {requestModal === "return" ? (
              <div className="mt-6 space-y-5">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                    Preferred Solution
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: "Return & Refund",
                        value: "REFUND" as PreferredResolution,
                        desc: "Return product and request money back.",
                      },
                      {
                        label: "Exchange Product",
                        value: "EXCHANGE" as PreferredResolution,
                        desc: "Return product and receive replacement.",
                      },
                    ].map((x) => (
                      <button
                        key={x.value}
                        type="button"
                        onClick={() => {
                          setPreferredResolution(x.value);
                          setRequestType(
                            x.value === "EXCHANGE"
                              ? "EXCHANGE"
                              : "RETURN_REFUND",
                          );
                        }}
                        className={`rounded-[20px] border p-4 text-left transition ${
                          preferredResolution === x.value
                            ? "border-white bg-white text-[#090a12]"
                            : "border-[#26293a] bg-[#0d0f17] text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="text-sm font-semibold">{x.label}</div>

                        <div
                          className={`mt-1 text-xs leading-5 ${
                            preferredResolution === x.value
                              ? "text-[#2d3038]"
                              : "text-[#a7aec4]"
                          }`}
                        >
                          {x.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                    Issue Type
                  </div>

                  <select
                    aria-label="Select return or exchange issue type"
                    title="Select return or exchange issue type"
                    value={requestType}
                    onChange={(e) =>
                      setRequestType(e.target.value as ReturnRequestType)
                    }
                    className="mt-2 h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none focus:border-[#d6c7ff]"
                  >
                    <option value="RETURN_REFUND">Return & Refund</option>
                    <option value="EXCHANGE">Exchange Product</option>
                    <option value="DAMAGED">Damaged Product</option>
                    <option value="WRONG_ITEM">Wrong Item Received</option>
                    <option value="SIZE_COLOR_ISSUE">Size / Color Issue</option>
                    <option value="NOT_SATISFIED">Not Satisfied</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                Reason
              </div>

              <textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder={
                  requestModal === "cancel"
                    ? "Example: Ordered by mistake..."
                    : "Example: Wrong size, damaged item, or wrong product..."
                }
                rows={5}
                maxLength={500}
                className="mt-2 w-full resize-none rounded-[20px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
              />

              <div className="mt-2 text-right text-[11px] text-[#7f879f]">
                {requestReason.length}/500
              </div>
            </div>

            {requestError ? (
              <div className="mt-4 rounded-[18px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {requestError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRequestModal}
                disabled={requestSaving}
                className={secondaryBtnClass}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitOrderRequest}
                disabled={requestSaving}
                className={primaryBtnClass}
              >
                {requestSaving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {refundModalOpen ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Submit refund details modal"
        >
          <button
            type="button"
            onClick={closeRefundModal}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close modal backdrop"
            title="Close"
          />

          <div
            className={`${panelClass} relative max-h-[90vh] w-full max-w-[620px] overflow-y-auto p-6 sm:p-7`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Refund Details
                </div>

                <div className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Submit Refund Account Details
                </div>

                <div className="mt-2 text-xs text-[#a7aec4]">
                  Order: {order?.orderId || orderIdFromUrl}
                </div>
              </div>

              <button
                type="button"
                onClick={closeRefundModal}
                disabled={refundSaving}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Refund Method
                </div>

                <select
                  aria-label="Select refund method"
                  title="Select refund method"
                  value={refundDraft.method}
                  onChange={(e) =>
                    setRefundDraft({
                      ...refundDraft,
                      method: e.target.value as RefundDetailsDraft["method"],
                    })
                  }
                  className="mt-2 h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none focus:border-[#d6c7ff]"
                >
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="FONEPAY">Fonepay</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              {refundDraft.method === "BANK" ? (
                <>
                  <input
                    value={refundDraft.accountName}
                    onChange={(e) =>
                      setRefundDraft({
                        ...refundDraft,
                        accountName: e.target.value,
                      })
                    }
                    placeholder="Account holder name"
                    className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                  />

                  <input
                    value={refundDraft.accountNumber}
                    onChange={(e) =>
                      setRefundDraft({
                        ...refundDraft,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="Account number"
                    className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                  />

                  <input
                    value={refundDraft.bankName}
                    onChange={(e) =>
                      setRefundDraft({
                        ...refundDraft,
                        bankName: e.target.value,
                      })
                    }
                    placeholder="Bank name"
                    className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                  />
                </>
              ) : (
                <>
                  <input
                    value={refundDraft.walletNumber}
                    onChange={(e) =>
                      setRefundDraft({
                        ...refundDraft,
                        walletNumber: e.target.value,
                      })
                    }
                    placeholder="Wallet number / mobile number"
                    className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                  />

                  <input
                    value={refundDraft.walletId}
                    onChange={(e) =>
                      setRefundDraft({
                        ...refundDraft,
                        walletId: e.target.value,
                      })
                    }
                    placeholder="Wallet ID / optional"
                    className="h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                  />
                </>
              )}

              <textarea
                value={refundDraft.customerNote}
                onChange={(e) =>
                  setRefundDraft({
                    ...refundDraft,
                    customerNote: e.target.value,
                  })
                }
                placeholder="Additional note for admin..."
                rows={4}
                maxLength={300}
                className="w-full resize-none rounded-[20px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
              />

              {refundError ? (
                <div className="rounded-[18px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {refundError}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRefundModal}
                  disabled={refundSaving}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitRefundDetails}
                  disabled={refundSaving}
                  className={primaryBtnClass}
                >
                  {refundSaving ? "Submitting..." : "Submit Details"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {reviewOpen && draft ? (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Write a review modal"
        >
          <button
            type="button"
            onClick={closeReviewModal}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label="Close modal backdrop"
            title="Close"
          />

          <div
            className={`${panelClass} relative max-h-[90vh] w-full max-w-[580px] overflow-y-auto p-6 sm:p-7`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Product Review
                </div>

                <div className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Write a Review
                </div>

                <div className="mt-2 text-sm text-[#a7aec4]">
                  Product:{" "}
                  <span className="font-medium text-white">
                    {draft.productName}
                  </span>
                </div>

                <div className="mt-1 text-xs text-[#a7aec4]">
                  Order: {draft.orderId}
                </div>
              </div>

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={reviewSaving}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Rating
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setDraft({ ...draft, rating: n })}
                      className={`h-11 w-11 rounded-full border text-sm font-semibold transition ${
                        draft.rating >= n
                          ? "border-white bg-white text-[#090a12]"
                          : "border-white/15 bg-white/5 text-[#a7aec4] hover:bg-white/10"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Title
                </div>

                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Short title (optional)"
                  maxLength={80}
                  className="mt-2 h-[48px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-4 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />
              </div>

              <div>
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  Comment
                </div>

                <textarea
                  value={draft.comment}
                  onChange={(e) =>
                    setDraft({ ...draft, comment: e.target.value })
                  }
                  placeholder="Write your experience..."
                  rows={5}
                  maxLength={500}
                  className="mt-2 w-full resize-none rounded-[20px] border border-[#26293a] bg-[#0d0f17] px-4 py-3 text-sm text-white outline-none placeholder:text-[#7f879f] focus:border-[#d6c7ff]"
                />

                <div className="mt-2 text-right text-[11px] text-[#7f879f]">
                  {draft.comment.length}/500
                </div>
              </div>

              {reviewError ? (
                <div className="rounded-[18px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {reviewError}
                </div>
              ) : null}

              {reviewOk ? (
                <div className="rounded-[18px] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                  {reviewOk}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={reviewSaving}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={reviewSaving}
                  className={primaryBtnClass}
                >
                  {reviewSaving ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}