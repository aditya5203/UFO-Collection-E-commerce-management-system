"use client";

import { API_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type CouponType = "PERCENT" | "FLAT" | "FREESHIP";
type CouponScope = "ALL" | "CATEGORY" | "PRODUCT";
type ToastType = "success" | "error" | "info";

type Coupon = {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  scope: CouponScope;
  value: number;
  minOrder?: number | null;
  maxDiscountCap?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  status?: string;
};

type CouponSectionProps = {
  showToast: (message: string, type?: ToastType) => void;
};

const API_BASE =
  API_URL;

const containerClass = "mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:bg-white/90 sm:px-6 sm:py-3";

const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10 sm:px-6 sm:py-3";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function normalizeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value: unknown) {
  const amount = normalizeNumber(value, 0);

  return `Rs. ${amount.toLocaleString("en-NP", {
    maximumFractionDigits: 2,
  })}`;
}

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function couponBadgeText(c: Coupon) {
  if (c.type === "PERCENT") return `${c.value}% OFF`;
  if (c.type === "FLAT") return `${formatMoney(c.value)} OFF`;
  return "FREE SHIPPING";
}

function couponTypeChip(c: Coupon) {
  if (c.type === "PERCENT") return "PERCENT";
  if (c.type === "FLAT") return "FLAT";
  return "FREESHIP";
}

function formatDateShort(iso?: string | null) {
  if (!iso) return "";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MotionButton({
  children,
  className,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.04, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="mb-6 flex flex-col items-start gap-4 text-left sm:mb-8 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="max-w-[660px]">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
          {eyebrow}
        </div>

        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white sm:text-[30px]">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </motion.div>
  );
}

function CouponSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`coupon-skeleton-${i}`}
          className="rounded-[20px] border border-[#2f3347] bg-[#161824] p-4 sm:p-5"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
          <div className="mt-3 h-3 w-24 animate-pulse rounded bg-white/5" />
          <div className="mt-5 h-7 w-28 animate-pulse rounded-full bg-white/5" />
          <div className="mt-5 h-3 w-full animate-pulse rounded bg-white/5" />
          <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export default function CouponSection({ showToast }: CouponSectionProps) {
  const router = useRouter();

  const [user, setUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState(true);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);
  const [collectingCode, setCollectingCode] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    let active = true;

    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!active) return;

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const me = data?.user || data?.data?.user || data?.data || null;

        setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoadingUser(false);
      }
    };

    fetchMe();

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoadingCoupons(true);

        const res = await fetch(`${API_BASE}/discounts/available`, {
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!active) return;

        if (!res.ok) {
          throw new Error(json?.message || "Failed to load coupons.");
        }

        const items: Coupon[] =
          (Array.isArray(json) && json) ||
          (Array.isArray(json?.data) && json.data) ||
          (Array.isArray(json?.items) && json.items) ||
          [];

        setCoupons(items.slice(0, 6));
      } catch {
        if (!active) return;

        setCoupons([]);
        showToast("Failed to load coupons.", "error");
      } finally {
        if (active) setLoadingCoupons(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [showToast]);

  const collectCoupon = async (code: string) => {
    const c = String(code || "").trim();

    if (!c || collectingCode) return;

    if (!user && !loadingUser) {
      showToast("Please sign up or login to collect coupons.", "info");

      window.setTimeout(() => {
        router.push("/signup");
      }, 700);

      return;
    }

    try {
      setCollectingCode(c);

      const res = await fetch(
        `${API_BASE}/discounts/collect/${encodeURIComponent(c)}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await safeJson(res);

      if (!res.ok) {
        if (res.status === 409 || data?.code === "COUPON_ALREADY_COLLECTED") {
          showToast("You already collected this coupon.", "info");

          window.setTimeout(() => {
            router.push("/discounts");
          }, 800);

          return;
        }

        if (res.status === 401 || data?.code === "UNAUTHORIZED") {
          showToast("Please login to collect coupons.", "info");

          window.setTimeout(() => {
            router.push("/login");
          }, 700);

          return;
        }

        showToast(
          data?.message || data?.error || "Failed to collect coupon.",
          "error"
        );
        return;
      }

      showToast("Coupon collected successfully.", "success");

      window.setTimeout(() => {
        router.push("/discounts");
      }, 800);
    } catch {
      showToast("Something went wrong while collecting coupon.", "error");
    } finally {
      setCollectingCode(null);
    }
  };

  const copyCouponCode = async (code: string) => {
    const cleanCode = String(code || "").trim();

    if (!cleanCode) return;

    try {
      await navigator.clipboard.writeText(cleanCode);
      showToast(`Coupon code ${cleanCode} copied.`, "success");
    } catch {
      showToast("Unable to copy coupon code.", "error");
    }
  };

  return (
    <section className="py-8 sm:py-10">
      <div className={containerClass}>
        <SectionHeading
          eyebrow="Discounts"
          title="Available Coupons"
          description="Collect coupons now and they will auto-apply in your cart when eligible."
          action={
            <div className="flex flex-wrap gap-3">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <Link href="/discounts" className={secondaryBtnClass}>
                  View All
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <Link href="/discounts" className={primaryBtnClass}>
                  Collect Coupons
                </Link>
              </motion.div>
            </div>
          }
        />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className={`${panelClass} p-4 sm:p-6`}
        >
          {loadingCoupons ? (
            <CouponSkeleton />
          ) : coupons.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="text-[16px] font-semibold text-white">
                No active coupons right now
              </div>
              <p className="mx-auto mt-2 max-w-[460px] text-[13px] leading-7 text-[#a7aec4]">
                New coupons and campaign discounts will appear here when they
                are activated by the admin.
              </p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {coupons.map((c) => (
                <motion.div
                  key={c.id || c.code}
                  variants={fadeUp}
                  whileHover={{ y: -7, scale: 1.012 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="rounded-[20px] border border-[#2f3347] bg-[#161824] p-4 transition duration-300 hover:border-[#4a506b] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[16px] font-semibold text-white">
                        {c.title || "Coupon"}
                      </div>

                      <div className="mt-1 text-[13px] text-[#a7aec4]">
                        Code:{" "}
                        <span className="font-semibold text-white">
                          {c.code}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      {couponTypeChip(c)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-green-500/15 px-3 py-1 text-[12px] font-semibold text-green-300">
                      {couponBadgeText(c)}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/80">
                      Scope: {c.scope}
                    </span>
                  </div>

                  {c.description ? (
                    <div className="mt-4 text-[12px] leading-7 text-[#a7aec4]">
                      {c.description}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2 text-[12px] text-[#a7aec4]">
                    {c.minOrder != null ? (
                      <div>Min order: {formatMoney(c.minOrder)}</div>
                    ) : null}

                    {c.type === "PERCENT" && c.maxDiscountCap != null ? (
                      <div>Max cap: {formatMoney(c.maxDiscountCap)}</div>
                    ) : null}

                    {c.endAt ? (
                      <div>Valid till: {formatDateShort(c.endAt)}</div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <MotionButton
                      onClick={() => collectCoupon(c.code)}
                      disabled={collectingCode === c.code}
                      className={`rounded-full px-4 py-2.5 text-[12px] font-semibold transition ${
                        collectingCode === c.code
                          ? "cursor-not-allowed bg-white/10 text-white/60"
                          : "bg-white text-[#090a12] hover:bg-white/90"
                      }`}
                    >
                      {collectingCode === c.code ? "Collecting..." : "Collect"}
                    </MotionButton>

                    <MotionButton
                      onClick={() => copyCouponCode(c.code)}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-white/10"
                    >
                      Copy
                    </MotionButton>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}