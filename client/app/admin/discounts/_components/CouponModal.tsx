"use client";

import React from "react";
import {
  CouponScope,
  CouponStatus,
  CouponType,
  FormState,
  inputClass,
  optionClass,
  primaryBtnClass,
  secondaryBtnClass,
} from "./discountTypes";
import { AlertBox, FormField } from "./DiscountShared";

type Props = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  saving: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  closeModal: () => void;
  saveCoupon: () => void;
};

export default function CouponModal({
  form,
  setForm,
  saving,
  error,
  setError,
  closeModal,
  saveCoupon,
}: Props) {
  function updateType(nextType: CouponType) {
    setError(null);

    setForm((p) => ({
      ...p,
      type: nextType,
      value: nextType === "FREESHIP" ? 0 : p.value || 1,
      maxDiscountCap: nextType === "PERCENT" ? p.maxDiscountCap ?? 500 : null,
    }));
  }

  function updateScope(nextScope: CouponScope) {
    setError(null);

    setForm((p) => ({
      ...p,
      scope: nextScope,
      eligibleCategoryIds:
        nextScope === "CATEGORY" ? p.eligibleCategoryIds : "",
      eligibleProductIds:
        nextScope === "PRODUCT" ? p.eligibleProductIds : "",
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div className="flex min-h-full items-start justify-center py-6">
        <div
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
        >
          <div className="shrink-0 border-b border-[#26293a] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                  Coupon Setup
                </div>

                <h3
                  id="coupon-modal-title"
                  className="mt-1 text-[20px] font-semibold text-white"
                >
                  {form.id ? "Edit Coupon" : "Create Coupon"}
                </h3>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  Configure discount rules, start date, and expiry date.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className={secondaryBtnClass}
              >
                Close
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {error ? (
                <div className="sm:col-span-2">
                  <AlertBox
                    type="error"
                    message={error}
                    onClose={() => setError(null)}
                  />
                </div>
              ) : null}

              <FormField label="Code" htmlFor="coupon-code">
                <input
                  id="coupon-code"
                  name="couponCode"
                  title="Coupon code"
                  aria-label="Coupon code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={!!form.id}
                  placeholder="NEWYEAR10"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Title" htmlFor="coupon-title">
                <input
                  id="coupon-title"
                  name="couponTitle"
                  title="Coupon title"
                  aria-label="Coupon title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="New Year Sale"
                  className={inputClass}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Description" htmlFor="coupon-description">
                  <input
                    id="coupon-description"
                    name="couponDescription"
                    title="Coupon description"
                    aria-label="Coupon description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Extra 10% off on all products"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Type" htmlFor="coupon-type">
                <select
                  id="coupon-type"
                  name="couponType"
                  title="Coupon type"
                  aria-label="Coupon type"
                  value={form.type}
                  onChange={(e) => updateType(e.target.value as CouponType)}
                  className={inputClass}
                >
                  <option className={optionClass()} value="PERCENT">
                    Percent
                  </option>
                  <option className={optionClass()} value="FLAT">
                    Flat (Rs)
                  </option>
                  <option className={optionClass()} value="FREESHIP">
                    Free Shipping
                  </option>
                </select>
              </FormField>

              <FormField label="Scope" htmlFor="coupon-scope">
                <select
                  id="coupon-scope"
                  name="couponScope"
                  title="Coupon scope"
                  aria-label="Coupon scope"
                  value={form.scope}
                  onChange={(e) => updateScope(e.target.value as CouponScope)}
                  className={inputClass}
                >
                  <option className={optionClass()} value="ALL">
                    All products
                  </option>
                  <option className={optionClass()} value="CATEGORY">
                    Specific category
                  </option>
                  <option className={optionClass()} value="PRODUCT">
                    Specific product
                  </option>
                </select>
              </FormField>

              <FormField
                label={form.type === "PERCENT" ? "Percent (%)" : "Value"}
                htmlFor="coupon-value"
              >
                <input
                  id="coupon-value"
                  name="couponValue"
                  title="Coupon value"
                  aria-label="Coupon value"
                  type="number"
                  min={form.type === "PERCENT" ? 1 : 0}
                  max={form.type === "PERCENT" ? 100 : undefined}
                  value={form.value}
                  disabled={form.type === "FREESHIP"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      value: e.target.value === "" ? 0 : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Max cap (Rs)" htmlFor="coupon-max-cap">
                <input
                  id="coupon-max-cap"
                  name="couponMaxCap"
                  title="Coupon max cap"
                  aria-label="Coupon max cap"
                  type="number"
                  min={0}
                  value={form.maxDiscountCap ?? ""}
                  disabled={form.type !== "PERCENT"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxDiscountCap:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Min order (Rs)" htmlFor="coupon-min-order">
                <input
                  id="coupon-min-order"
                  name="couponMinOrder"
                  title="Coupon minimum order"
                  aria-label="Coupon minimum order"
                  type="number"
                  min={0}
                  value={form.minOrder ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      minOrder:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Per user limit" htmlFor="coupon-per-user-limit">
                <input
                  id="coupon-per-user-limit"
                  name="couponPerUserLimit"
                  title="Coupon per user limit"
                  aria-label="Coupon per user limit"
                  type="number"
                  min={1}
                  value={form.maxUsesPerUser ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      maxUsesPerUser:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Global usage limit" htmlFor="coupon-global-limit">
                <input
                  id="coupon-global-limit"
                  name="couponGlobalLimit"
                  title="Coupon global usage limit"
                  aria-label="Coupon global usage limit"
                  type="number"
                  min={1}
                  value={form.globalUsageLimit ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      globalUsageLimit:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Start date" htmlFor="coupon-start-date">
                <input
                  id="coupon-start-date"
                  name="couponStartDate"
                  title="Coupon start date"
                  aria-label="Coupon start date"
                  type="date"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startAt: e.target.value }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="End date" htmlFor="coupon-end-date">
                <input
                  id="coupon-end-date"
                  name="couponEndDate"
                  title="Coupon end date"
                  aria-label="Coupon end date"
                  type="date"
                  value={form.endAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endAt: e.target.value }))
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Status" htmlFor="coupon-status">
                <select
                  id="coupon-status"
                  name="couponStatus"
                  title="Coupon status"
                  aria-label="Coupon status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      status: e.target.value as CouponStatus,
                    }))
                  }
                  className={inputClass}
                >
                  <option className={optionClass()} value="ACTIVE">
                    Active
                  </option>
                  <option className={optionClass()} value="PAUSED">
                    Paused
                  </option>
                </select>
              </FormField>

              {form.scope === "CATEGORY" ? (
                <div className="sm:col-span-2">
                  <FormField
                    label="Eligible Category IDs"
                    htmlFor="coupon-category-ids"
                  >
                    <input
                      id="coupon-category-ids"
                      name="couponCategoryIds"
                      title="Eligible category IDs"
                      aria-label="Eligible category IDs"
                      value={form.eligibleCategoryIds}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          eligibleCategoryIds: e.target.value,
                        }))
                      }
                      placeholder="Example: 662f..., 663a..."
                      className={inputClass}
                    />
                  </FormField>

                  <p className="mt-2 text-[12px] leading-6 text-[#7f879f]">
                    Enter category IDs separated by commas. You can replace this
                    with a category picker later.
                  </p>
                </div>
              ) : null}

              {form.scope === "PRODUCT" ? (
                <div className="sm:col-span-2">
                  <FormField
                    label="Eligible Product IDs"
                    htmlFor="coupon-product-ids"
                  >
                    <input
                      id="coupon-product-ids"
                      name="couponProductIds"
                      title="Eligible product IDs"
                      aria-label="Eligible product IDs"
                      value={form.eligibleProductIds}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          eligibleProductIds: e.target.value,
                        }))
                      }
                      placeholder="Example: 662f..., 663a..."
                      className={inputClass}
                    />
                  </FormField>

                  <p className="mt-2 text-[12px] leading-6 text-[#7f879f]">
                    Enter product IDs separated by commas. You can replace this
                    with a product picker later.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#26293a] px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-[#7f879f]">
                Active, upcoming, expired, and paused status are calculated from
                status plus start/end date.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={secondaryBtnClass}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveCoupon}
                  disabled={saving}
                  className={primaryBtnClass}
                >
                  {saving ? "Saving..." : form.id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}