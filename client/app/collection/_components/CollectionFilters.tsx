"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

type CustomerType = "Men" | "Women" | "Boys" | "Girls";
type ToastType = "success" | "error" | "info";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 sm:px-6 sm:py-3";

const fadeLeft = {
  hidden: { opacity: 0, x: -26 },
  show: { opacity: 1, x: 0 },
};

function FilterCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-[10px] px-1.5 py-1.5 transition hover:bg-white/5">
      <input
        type="checkbox"
        className="h-4 w-4 accent-white"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function FilterContent({
  selectedCustomers,
  selectedTypes,
  filterTypes,
  toggleCustomer,
  toggleType,
}: {
  selectedCustomers: CustomerType[];
  selectedTypes: string[];
  filterTypes: string[];
  toggleCustomer: (value: CustomerType) => void;
  toggleType: (value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <div className="mt-5">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
          {t("collection.customers")}
        </div>

        <div className="grid gap-2 text-[13px] text-[#d6dbeb]">
          {(["Men", "Women", "Boys", "Girls"] as CustomerType[]).map(
            (customer) => (
              <FilterCheckbox
                key={customer}
                label={customer}
                checked={selectedCustomers.includes(customer)}
                onChange={() => toggleCustomer(customer)}
              />
            )
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]">
          {t("collection.types")}
        </div>

        <div className="grid gap-2 text-[13px] text-[#d6dbeb]">
          {filterTypes.map((type) => (
            <FilterCheckbox
              key={type}
              label={type}
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default function CollectionFilters({
  mobileFiltersOpen,
  setMobileFiltersOpen,
  activeFiltersCount,
  hasWeatherContext,
  selectedCustomers,
  selectedTypes,
  filterTypes,
  toggleCustomer,
  toggleType,
  clearFiltersWithToast,
  showToast,
}: {
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (value: boolean) => void;
  activeFiltersCount: number;
  hasWeatherContext: boolean;
  selectedCustomers: CustomerType[];
  selectedTypes: string[];
  filterTypes: string[];
  toggleCustomer: (value: CustomerType) => void;
  toggleType: (value: string) => void;
  clearFiltersWithToast: () => void;
  showToast: (message: string, type?: ToastType) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <motion.aside
        initial="hidden"
        animate="show"
        variants={fadeLeft}
        transition={{ duration: 0.45, delay: 0.14 }}
        className={`hidden h-fit ${panelClass} p-4 lg:block`}
      >
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
            {t("collection.filters")}
          </div>

          {activeFiltersCount > 0 || hasWeatherContext ? (
            <button
              type="button"
              onClick={clearFiltersWithToast}
              className="text-[12px] text-[#d6c7ff] hover:underline"
            >
              {t("collection.clear")}
            </button>
          ) : null}
        </div>

        <FilterContent
          selectedCustomers={selectedCustomers}
          selectedTypes={selectedTypes}
          filterTypes={filterTypes}
          toggleCustomer={toggleCustomer}
          toggleType={toggleType}
        />
      </motion.aside>

      <AnimatePresence>
        {mobileFiltersOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute right-0 top-0 h-full w-[88%] max-w-[380px] overflow-y-auto border-l border-[#26293a] bg-[#11121a] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white">
                  {t("collection.filters")}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white"
                >
                  ✕
                </button>
              </div>

              {activeFiltersCount > 0 || hasWeatherContext ? (
                <button
                  type="button"
                  onClick={clearFiltersWithToast}
                  className="mt-4 w-full rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-[12px] font-semibold text-red-200"
                >
                  {t("collection.clearAll")}
                </button>
              ) : null}

              <FilterContent
                selectedCustomers={selectedCustomers}
                selectedTypes={selectedTypes}
                filterTypes={filterTypes}
                toggleCustomer={toggleCustomer}
                toggleType={toggleType}
              />

              <button
                type="button"
                onClick={() => {
                  setMobileFiltersOpen(false);

                  if (activeFiltersCount > 0 || hasWeatherContext) {
                    showToast(t("collection.filtersApplied"), "success");
                  }
                }}
                className={`${primaryBtnClass} mt-7 flex w-full justify-center`}
              >
                {t("collection.applyFilters")}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}