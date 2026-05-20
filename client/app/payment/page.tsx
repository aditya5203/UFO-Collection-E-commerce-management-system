"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

type CartItem = {
  id: string;
  productId?: string;
  variantId?: string | null;
  name: string;
  size: string;
  color: string;
  colorLabel: string;
  sku?: string | null;
  price: number;
  qty: number;
  image: string;
  stock?: number | null;
  totalProductStock?: number | null;
};

type PayMethod = "esewa" | "khalti" | "cod";
type ToastType = "success" | "error" | "info";

type CheckoutAddressLS = {
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  country?: string;
  provinceId?: string;
  provinceName?: string;
  district?: string;
  cityOrMunicipality?: string;
  addressLine?: string;
  street?: string;
  postalCode?: string;
  phone?: string;
  savedAddressId?: string | null;
  lat?: number;
  lng?: number;
};

type OrderAddressAPI = {
  label?: "Home" | "Work" | "Other";
  email?: string;
  fullName: string;
  phone: string;
  provinceId?: string;
  district?: string;
  city: string;
  area?: string;
  addressLine?: string;
  street: string;
  postalCode?: string;
  lat?: number;
  lng?: number;
};

type OrderSummaryLS = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount?: number;
  currency?: string;
  updatedAt?: string;
  couponCode?: string | null;
  items?: CartItem[];
};

const API_BASE =
  API_BASE_URL;

const CART_KEY = "ufo_cart";
const ORDER_SUMMARY_KEY = "ufo_order_summary";
const CHECKOUT_ITEMS_KEY = "ufo_checkout_items";
const CHECKOUT_ADDRESS_KEY = "ufo_checkout_address";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

function formatNpr(value: number) {
  return `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-NP")}`;
}

function hasRealStockValue(stock: unknown) {
  return typeof stock === "number" && Number.isFinite(stock);
}

function normalizeCartItems(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item: any) => {
      const productId = String(item?.productId || item?.id || "").trim();
      const variantId = String(item?.variantId || "").trim();

      return {
        id: productId,
        productId,
        variantId: variantId || null,
        name: String(item?.name || "Product").trim(),
        size: String(item?.size || "").trim().toUpperCase(),
        color: String(item?.color || "").trim(),
        colorLabel: String(item?.colorLabel || "").trim(),
        sku: String(item?.sku || "").trim() || null,
        price: Math.max(0, Number(item?.price || 0)),
        qty: Math.max(1, Math.min(99, Number(item?.qty || 1))),
        image: String(item?.image || "").trim(),
        stock: hasRealStockValue(item?.stock) ? Number(item.stock) : null,
        totalProductStock: hasRealStockValue(item?.totalProductStock)
          ? Number(item.totalProductStock)
          : null,
      };
    })
    .filter((item) => item.productId && item.price >= 0);
}

function getOrderSummary(): OrderSummaryLS | null {
  try {
    const raw = localStorage.getItem(ORDER_SUMMARY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      subtotal: Number(parsed.subtotal || 0),
      shipping: Number(parsed.shipping || 0),
      discount: Number(parsed.discount || 0),
      total: Number(parsed.total || 0),
      itemCount: Number(parsed.itemCount || 0),
      currency: parsed.currency || "NPR",
      updatedAt: parsed.updatedAt,
      couponCode: parsed.couponCode ?? null,
      items: normalizeCartItems(parsed.items || []),
    };
  } catch {
    return null;
  }
}

function normalizeNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;

  const n = typeof v === "number" ? v : Number(v);

  return Number.isFinite(n) ? n : undefined;
}

function getCheckoutAddressLS(): CheckoutAddressLS | undefined {
  try {
    const raw =
      localStorage.getItem(CHECKOUT_ADDRESS_KEY) ||
      localStorage.getItem("checkout_address") ||
      localStorage.getItem("ufo_address") ||
      "";

    if (!raw) return undefined;

    const addr = JSON.parse(raw);

    return addr && typeof addr === "object"
      ? (addr as CheckoutAddressLS)
      : undefined;
  } catch {
    return undefined;
  }
}

function mapToOrderAddress(a?: CheckoutAddressLS): OrderAddressAPI | undefined {
  if (!a) return undefined;

  const fullName =
    String(a.fullName || "").trim() ||
    `${a.firstName || ""} ${a.lastName || ""}`.trim();

  const phone = String(a.phone || "").replace(/\D/g, "");
  const city = String(a.cityOrMunicipality || "").trim();
  const district = String(a.district || "").trim();
  const street = String(a.street || a.addressLine || "").trim();
  const addressLine = String(a.addressLine || "").trim();

  const lat = normalizeNumber(a.lat);
  const lng = normalizeNumber(a.lng);

  if (!fullName && !phone && !city && !district && !street && !addressLine) {
    return undefined;
  }

  return {
    label: "Home",
    email: String(a.email || "").trim(),
    fullName: fullName || "Customer",
    phone,
    provinceId: String(a.provinceId || "").trim(),
    district,
    city,
    area: district,
    addressLine,
    street,
    postalCode: String(a.postalCode || "").trim(),
    lat,
    lng,
  };
}

function readCartItems(): CartItem[] {
  try {
    const checkoutRaw = localStorage.getItem(CHECKOUT_ITEMS_KEY);
    if (checkoutRaw) {
      const checkoutItems = normalizeCartItems(JSON.parse(checkoutRaw));
      if (checkoutItems.length) return checkoutItems;
    }

    const summary = getOrderSummary();
    if (summary?.items?.length) {
      return normalizeCartItems(summary.items);
    }

    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return normalizeCartItems(parsed);
  } catch {
    return [];
  }
}

function getItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function hasStockIssue(items: CartItem[]) {
  return items.some((item) => {
    if (!hasRealStockValue(item.stock)) return false;

    const stock = Number(item.stock);
    const qty = Number(item.qty || 0);

    return stock <= 0 || qty > stock;
  });
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />

        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function StepIndicator() {
  const { t } = useI18n();

  const steps = [
    { label: t("paymentPage.cart"), href: "/cartpage", active: false },
    {
      label: t("paymentPage.information"),
      href: "/checkout",
      active: false,
    },
    { label: t("paymentPage.payment"), href: "/payment", active: true },
  ];

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 text-[13px] text-[#a7aec4]">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          {step.active ? (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white">
              {step.label}
            </span>
          ) : (
            <Link
              href={step.href}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition hover:text-white"
            >
              {step.label}
            </Link>
          )}

          {index < steps.length - 1 ? (
            <span className="text-[#50576f]">/</span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function PaymentIcon({ method }: { method: PayMethod }) {
  const src =
    method === "esewa"
      ? "/images/esewa.png"
      : method === "khalti"
        ? "/images/khalti.png"
        : "/images/cod.png";

  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/5">
      <Image
        src={src}
        alt={method}
        fill
        className="object-contain p-2"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const [items, setItems] = React.useState<CartItem[]>([]);
  const [cartReady, setCartReady] = React.useState(false);
  const [method, setMethod] = React.useState<PayMethod>("esewa");
  const [placing, setPlacing] = React.useState(false);

  const [summary, setSummary] = React.useState<OrderSummaryLS | null>(null);
  const [address, setAddress] = React.useState<CheckoutAddressLS | undefined>();

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const apiBase = React.useMemo(() => joinUrl(API_BASE, "/api"), []);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2800);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    try {
      const parsed = readCartItems();
      setItems(parsed);

      if (!parsed.length) {
        showToast(t("paymentPage.cartEmptyRedirect"), "error");
        router.replace("/cartpage");
        return;
      }

      if (hasStockIssue(parsed)) {
        showToast(t("paymentPage.stockIssues"), "error");
        router.replace("/cartpage");
        return;
      }

      localStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(parsed));
    } catch {
      setItems([]);
      showToast(t("paymentPage.failedLoadCart"), "error");
      router.replace("/cartpage");
    } finally {
      setCartReady(true);
    }
  }, [router, showToast, t]);

  React.useEffect(() => {
    const s = getOrderSummary();
    const a = getCheckoutAddressLS();

    setSummary(s);
    setAddress(a);

    if (!a) {
      showToast(t("paymentPage.addDeliveryAddress"), "error");
      router.replace("/checkout");
    }
  }, [router, showToast, t]);

  const fallbackSubtotal = React.useMemo(() => {
    return items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0),
      0
    );
  }, [items]);

  const fallbackShipping = cartReady && items.length ? 100 : 0;
  const fallbackTotal = fallbackSubtotal + fallbackShipping;

  const subtotal = summary ? summary.subtotal : fallbackSubtotal;
  const shipping = summary ? summary.shipping : fallbackShipping;
  const discount = summary ? summary.discount : 0;
  const total = summary ? summary.total : fallbackTotal;

  const selectedMethodLabel =
    method === "esewa"
      ? "eSewa"
      : method === "khalti"
        ? "Khalti"
        : "Cash on Delivery";

  const fullName =
    String(address?.fullName || "").trim() ||
    `${address?.firstName || ""} ${address?.lastName || ""}`.trim();

  const savePaymentMeta = (label: string) => {
    try {
      localStorage.setItem("ufo_payment_method", label);
      localStorage.setItem(
        "ufo_last_total_paisa",
        String(Math.round(total * 100))
      );
    } catch {
      // ignore
    }
  };

  const createOrder = async (
    paymentMethod: "COD" | "Khalti" | "eSewa",
    paymentRef?: string,
    paymentStatus?: "Paid" | "Pending" | "Failed"
  ) => {
    let safeItems: CartItem[] = items;

    if (!safeItems.length) {
      safeItems = readCartItems();
    }

    if (!safeItems.length) throw new Error(t("paymentPage.cartEmpty"));

    if (hasStockIssue(safeItems)) {
      throw new Error(t("paymentPage.itemOutOfStock"));
    }

    const addrLS = getCheckoutAddressLS();
    const mappedAddress = mapToOrderAddress(addrLS);

    if (!mappedAddress) {
      throw new Error(t("paymentPage.deliveryAddressMissing"));
    }

    const payload: any = {
      paymentMethod,
      paymentRef: paymentRef || undefined,
      paymentStatus: paymentStatus || undefined,
      shippingPaisa: Math.round(shipping * 100),
      couponCode: summary?.couponCode || null,

      items: safeItems.map((it) => ({
        productId: it.productId || it.id,
        variantId: it.variantId || null,
        size: it.size || "",
        color: it.color || "",
        colorLabel: it.colorLabel || "",
        sku: it.sku || null,
        qty: Math.max(1, Number(it.qty || 1)),
      })),

      address: mappedAddress,
    };

    const res = await fetch(joinUrl(apiBase, "/orders"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      throw new Error(json?.message || t("paymentPage.failedCreateOrder"));
    }

    return json?.data as {
      id: string;
      orderCode: string;
      totalPaisa: number;
      paymentStatus?: string;
    };
  };

  const finishToThankYou = (data: {
    id: string;
    orderCode: string;
    totalPaisa: number;
  }) => {
    localStorage.setItem("ufo_last_order_id", data.id);
    localStorage.setItem("ufo_last_order_number", data.orderCode);
    localStorage.setItem("ufo_last_total_paisa", String(data.totalPaisa));

    localStorage.removeItem(CART_KEY);
    localStorage.removeItem(ORDER_SUMMARY_KEY);
    localStorage.removeItem(CHECKOUT_ITEMS_KEY);
    localStorage.removeItem("checkout_address");
    localStorage.removeItem(CHECKOUT_ADDRESS_KEY);

    window.dispatchEvent(new Event("ufo_cart_updated"));
    router.replace("/ThankYou");
  };

  React.useEffect(() => {
    const status = searchParams.get("status");

    if (status === "failed") {
      showToast(t("paymentPage.paymentFailed"), "error");
    }
  }, [searchParams, showToast, t]);

  React.useEffect(() => {
    if (!cartReady) return;

    const pidx = searchParams.get("pidx");
    if (!pidx) return;

    const sessionKey = `khalti_finalized_${pidx}`;
    const already = sessionStorage.getItem(sessionKey);
    if (already === "1") return;

    const run = async () => {
      try {
        setPlacing(true);
        sessionStorage.setItem(sessionKey, "1");
        showToast(t("paymentPage.verifyingKhalti"), "info");

        const vr = await fetch(joinUrl(apiBase, "/payments/khalti/lookup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pidx }),
        });

        const vj = await vr.json().catch(() => ({} as any));

        if (!vr.ok) {
          throw new Error(vj?.message || t("paymentPage.khaltiLookupFailed"));
        }

        if (!vj?.paid) {
          throw new Error(
            `${t("paymentPage.khaltiNotCompleted")} Status: ${
              vj?.status || "Unknown"
            }`
          );
        }

        savePaymentMeta("Khalti");

        const order = await createOrder("Khalti", pidx, "Paid");
        finishToThankYou(order);
      } catch (e: any) {
        console.error(e);
        sessionStorage.removeItem(sessionKey);
        showToast(
          e?.message || t("paymentPage.failedFinalizeKhalti"),
          "error"
        );
      } finally {
        setPlacing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, searchParams, apiBase, t]);

  React.useEffect(() => {
    if (!cartReady) return;

    const esewa = searchParams.get("esewa");
    const data = searchParams.get("data") || "";

    if (esewa !== "success" || !data) return;

    const sessionKey = `esewa_finalized_${data.slice(0, 32)}`;
    const already = sessionStorage.getItem(sessionKey);
    if (already === "1") return;

    const run = async () => {
      try {
        setPlacing(true);
        sessionStorage.setItem(sessionKey, "1");
        showToast(t("paymentPage.verifyingEsewa"), "info");

        const vr = await fetch(joinUrl(apiBase, "/payments/esewa/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ data }),
        });

        const vj = await vr.json().catch(() => ({} as any));

        if (!vr.ok) {
          throw new Error(vj?.message || t("paymentPage.esewaVerifyFailed"));
        }

        const ref =
          String(
            vj?.transaction_uuid || vj?.payload?.transaction_uuid || ""
          ).trim() || "ESEWA_OK";

        savePaymentMeta("eSewa");

        const payStatus: "Paid" | "Pending" = vj?.statusOk
          ? "Paid"
          : "Pending";

        const order = await createOrder("eSewa", ref, payStatus);
        finishToThankYou(order);
      } catch (e: any) {
        console.error(e);
        sessionStorage.removeItem(sessionKey);
        showToast(e?.message || t("paymentPage.failedFinalizeEsewa"), "error");
      } finally {
        setPlacing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartReady, searchParams, apiBase, t]);

  const ensureReadyForPayment = () => {
    if (!cartReady || placing) return false;

    if (!items.length) {
      showToast(t("paymentPage.cartEmptyRedirect"), "error");
      router.push("/cartpage");
      return false;
    }

    if (hasStockIssue(items)) {
      showToast(t("paymentPage.stockIssues"), "error");
      router.push("/cartpage");
      return false;
    }

    if (!address) {
      showToast(t("paymentPage.addDeliveryAddress"), "error");
      router.push("/checkout");
      return false;
    }

    if (total <= 0) {
      showToast(t("paymentPage.invalidOrderTotal"), "error");
      return false;
    }

    return true;
  };

  const handleEsewaPay = () => {
    if (!ensureReadyForPayment()) return;

    savePaymentMeta("eSewa");
    showToast(t("paymentPage.redirectingEsewa"), "info");

    window.location.href = joinUrl(
      apiBase,
      `/payments/esewa/initiate?amount=${encodeURIComponent(String(total))}`
    );
  };

  const handleKhaltiPay = async () => {
    if (!ensureReadyForPayment()) return;

    try {
      setPlacing(true);
      savePaymentMeta("Khalti");
      showToast(t("paymentPage.startingKhalti"), "info");

      const res = await fetch(joinUrl(apiBase, "/payments/khalti/initiate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: Math.round(total * 100),
          orderId: `ORDER_${Date.now()}`,
          orderName: "UFO Collection Order",
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        showToast(
          data?.message || t("paymentPage.failedInitiateKhalti"),
          "error"
        );
        return;
      }

      if (data?.payment_url) {
        window.location.href = data.payment_url;
        return;
      }

      showToast(t("paymentPage.khaltiNoUrl"), "error");
    } catch (e: any) {
      showToast(e?.message || t("paymentPage.failedInitiateKhalti"), "error");
    } finally {
      setPlacing(false);
    }
  };

  const handleContinue = async () => {
    if (!ensureReadyForPayment()) return;

    if (method === "esewa") return handleEsewaPay();
    if (method === "khalti") return void handleKhaltiPay();

    try {
      setPlacing(true);
      savePaymentMeta("Cash on Delivery");
      showToast(t("paymentPage.placingCod"), "info");

      const order = await createOrder("COD", undefined, "Pending");
      finishToThankYou(order);
    } catch (e: any) {
      showToast(e?.message || t("paymentPage.failedPlaceCod"), "error");
    } finally {
      setPlacing(false);
    }
  };

  const paymentMethods = [
    {
      key: "esewa" as PayMethod,
      label: "eSewa",
      subtitle: t("paymentPage.esewaSubtitle"),
      badge: t("paymentPage.online"),
    },
    {
      key: "khalti" as PayMethod,
      label: "Khalti",
      subtitle: t("paymentPage.khaltiSubtitle"),
      badge: t("paymentPage.online"),
    },
    {
      key: "cod" as PayMethod,
      label: "Cash on Delivery",
      subtitle: t("paymentPage.codSubtitle"),
      badge: "COD",
    },
  ];

  return (
    <>
      <CartHeader backHref="/checkout" />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <StepIndicator />

          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              {t("paymentPage.payment")}
            </div>

            <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              {t("paymentPage.choosePaymentMethod")}
            </h1>

            <p className="mt-2 max-w-[640px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              {t("paymentPage.paymentDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
            <section className={`${panelClass} p-5 sm:p-7`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    {t("paymentPage.method")}
                  </div>

                  <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                    {t("paymentPage.paymentOptions")}
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#a7aec4]">
                  {selectedMethodLabel}
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {paymentMethods.map((m) => {
                  const active = method === m.key;

                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      disabled={placing}
                      className={`flex w-full items-center gap-4 rounded-[20px] border p-4 text-left transition ${
                        active
                          ? "border-white bg-white/10 shadow-[0_20px_60px_rgba(255,255,255,0.06)]"
                          : "border-[#26293a] bg-[#161824] hover:border-[#4a506b] hover:bg-white/5"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <PaymentIcon method={m.key} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            {m.label}
                          </span>

                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#c8cde0]">
                            {m.badge}
                          </span>
                        </div>

                        <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
                          {m.subtitle}
                        </p>
                      </div>

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? "border-white bg-white"
                            : "border-[#5b6380] bg-transparent"
                        }`}
                      >
                        {active ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#090a12]" />
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                  {t("paymentPage.paymentNote")}
                </div>

                <p className="mt-2 text-[13px] leading-7 text-[#a7aec4]">
                  {method === "esewa" && t("paymentPage.esewaNote")}
                  {method === "khalti" && t("paymentPage.khaltiNote")}
                  {method === "cod" && t("paymentPage.codNote")}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  [t("paymentPage.secure"), t("paymentPage.payment")],
                  [t("paymentPage.verified"), t("paymentPage.order")],
                  [t("paymentPage.nepal"), t("paymentPage.wallets")],
                ].map(([a, b]) => (
                  <div
                    key={`${a}-${b}`}
                    className="rounded-[16px] border border-[#26293a] bg-[#161824] p-4 text-center"
                  >
                    <div className="text-[13px] font-semibold text-white">
                      {a}
                    </div>

                    <div className="mt-1 text-[11px] text-[#a7aec4]">{b}</div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="lg:sticky lg:top-[104px] lg:self-start">
              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                      {t("paymentPage.summary")}
                    </div>

                    <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                      {t("paymentPage.orderSummary")}
                    </h2>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#a7aec4]">
                    {summary?.itemCount || getItemCount(items) || items.length}{" "}
                    {(summary?.itemCount || getItemCount(items) || items.length) ===
                    1
                      ? t("paymentPage.item")
                      : t("paymentPage.items")}
                  </span>
                </div>

                {items.length > 0 ? (
                  <div className="mt-5 max-h-[260px] space-y-3 overflow-y-auto border-y border-[#26293a] py-4 pr-1">
                    {items.map((item) => (
                      <div
                        key={`${item.productId || item.id}-${
                          item.variantId || item.size
                        }-${item.color}`}
                        className="rounded-[16px] border border-[#26293a] bg-[#161824] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold text-white">
                              {item.name}
                            </div>

                            <div className="mt-1 text-[11px] text-[#a7aec4]">
                              {item.colorLabel || item.color} /{" "}
                              {item.size || "-"} × {item.qty}
                            </div>

                            {item.sku ? (
                              <div className="mt-1 text-[11px] text-[#7f879f]">
                                SKU: {item.sku}
                              </div>
                            ) : null}
                          </div>

                          <div className="shrink-0 text-right text-[12px] font-semibold text-[#d6c7ff]">
                            {formatNpr(item.price * item.qty)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6 space-y-4 text-sm text-[#a7aec4] sm:text-[15px]">
                  <div className="flex items-center justify-between gap-4">
                    <span>{t("paymentPage.subtotal")}</span>
                    <span className="text-right text-white">
                      {formatNpr(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>{t("paymentPage.shipping")}</span>
                    <span className="text-right text-white">
                      {formatNpr(shipping)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>
                      {t("paymentPage.discount")}{" "}
                      {summary?.couponCode ? `(${summary.couponCode})` : ""}
                    </span>

                    <span className="text-right text-green-400">
                      - {formatNpr(discount)}
                    </span>
                  </div>

                  <div className="h-px bg-[#26293a]" />

                  <div className="flex items-center justify-between gap-4 text-[18px] font-semibold">
                    <span className="text-white">
                      {t("paymentPage.total")}
                    </span>

                    <span className="text-right text-white">
                      {formatNpr(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#cbd5f5]">
                    {t("paymentPage.deliveryTo")}
                  </div>

                  {address ? (
                    <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#a7aec4]">
                      <div className="font-semibold text-white">
                        {fullName || t("paymentPage.customer")}
                      </div>

                      {address.phone ? <div>{address.phone}</div> : null}

                      <div>
                        {[address.addressLine, address.street]
                          .filter(Boolean)
                          .join(", ")}
                      </div>

                      <div>
                        {[
                          address.cityOrMunicipality,
                          address.district,
                          address.provinceName,
                          "Nepal",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-[13px] leading-6 text-yellow-100">
                      {t("paymentPage.noDeliveryAddress")}
                    </div>
                  )}

                  <Link
                    href="/checkout"
                    className="mt-4 inline-flex text-[12px] font-semibold uppercase tracking-[0.16em] text-[#d6c7ff] hover:underline"
                  >
                    {t("paymentPage.editAddress")}
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={placing || !cartReady}
                  className={`${primaryBtnClass} mt-6 w-full`}
                >
                  {placing
                    ? t("paymentPage.processing")
                    : method === "cod"
                      ? t("paymentPage.placeCodOrder")
                      : `${t("paymentPage.payWith")} ${selectedMethodLabel}`}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  disabled={placing}
                  className={`${secondaryBtnClass} mt-3 w-full`}
                >
                  {t("paymentPage.backToInformation")}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}

export default function PaymentPage() {
  return (
    <React.Suspense fallback={null}>
      <PaymentPageContent />
    </React.Suspense>
  );
}
