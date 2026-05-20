"use client";

import { API_BASE_URL } from "@/lib/api";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useI18n } from "@/lib/i18n/I18nProvider";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  type Province,
  type District,
} from "../data/nepalLocations";

const API_BASE =
  API_BASE_URL;

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const CART_KEY = "ufo_cart";
const ORDER_SUMMARY_KEY = "ufo_order_summary";
const CHECKOUT_ITEMS_KEY = "ufo_checkout_items";
const CHECKOUT_ADDRESS_KEY = "ufo_checkout_address";

const defaultCenter = {
  lat: 27.7172,
  lng: 85.324,
};

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";

const containerClass =
  "mx-auto max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";

const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";

const primaryBtnClass =
  "inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const secondaryBtnClass =
  "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const inputClass =
  "h-[50px] w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

type LatLng = {
  lat: number;
  lng: number;
};

type Toast = {
  type: "success" | "error" | "info";
  message: string;
};

type CheckoutCartItem = {
  id: string;
  productId: string;
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

type OrderSummary = {
  subtotal?: number;
  shipping?: number;
  discount?: number;
  total?: number;
  subtotalRs?: number;
  shippingRs?: number;
  discountRs?: number;
  totalRs?: number;
  itemCount?: number;
  couponCode?: string | null;
  currency?: string;
  updatedAt?: string;
  items?: CheckoutCartItem[];
};

function formatMoney(value: number) {
  return `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-NP")}`;
}

function getMoney(
  summary: OrderSummary | null,
  rsKey: keyof OrderSummary,
  key: keyof OrderSummary
) {
  const rsRaw = summary?.[rsKey];
  const raw = summary?.[key];

  if (rsRaw !== undefined && rsRaw !== null && rsRaw !== "") {
    const rsValue = Number(rsRaw);
    if (Number.isFinite(rsValue)) return rsValue;
  }

  if (raw !== undefined && raw !== null && raw !== "") {
    const rawValue = Number(raw);
    if (Number.isFinite(rawValue)) return rawValue;
  }

  return 0;
}

function hasRealStockValue(stock: unknown) {
  return typeof stock === "number" && Number.isFinite(stock);
}

function sanitizeCheckoutItems(input: unknown): CheckoutCartItem[] {
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

function getCartCount(items: CheckoutCartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function hasStockIssue(items: CheckoutCartItem[]) {
  return items.some((item) => {
    if (!hasRealStockValue(item.stock)) return false;

    const stock = Number(item.stock);
    const qty = Number(item.qty || 0);

    return stock <= 0 || qty > stock;
  });
}

function buildSummaryFromCart(
  cartItems: CheckoutCartItem[],
  previousSummary: OrderSummary | null
): OrderSummary {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  const shipping = Number(
    previousSummary?.shipping ?? previousSummary?.shippingRs ?? 100
  );

  const discount = Number(
    previousSummary?.discount ?? previousSummary?.discountRs ?? 0
  );

  const total = Math.max(0, subtotal + shipping - discount);

  return {
    ...previousSummary,
    subtotal,
    shipping,
    discount,
    total,
    currency: previousSummary?.currency || "NPR",
    itemCount: getCartCount(cartItems),
    couponCode: previousSummary?.couponCode || null,
    updatedAt: new Date().toISOString(),
    items: cartItems,
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [provinceId, setProvinceId] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [cityOrMunicipality, setCityOrMunicipality] = React.useState("");

  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  const [addressLine, setAddressLine] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [saveForNextTime, setSaveForNextTime] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [toast, setToast] = React.useState<Toast | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [orderSummary, setOrderSummary] = React.useState<OrderSummary | null>(
    null
  );
  const [checkoutItems, setCheckoutItems] = React.useState<CheckoutCartItem[]>(
    []
  );
  const [cartChecked, setCartChecked] = React.useState(false);

  const [mapCenter, setMapCenter] = React.useState<LatLng>(defaultCenter);
  const [markerPosition, setMarkerPosition] =
    React.useState<LatLng>(defaultCenter);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const districtsForProvince: District[] = React.useMemo(() => {
    return NEPAL_DISTRICTS.filter((d) => d.provinceId === provinceId);
  }, [provinceId]);

  const selectedProvince = React.useMemo(() => {
    return NEPAL_PROVINCES.find((p) => p.id === provinceId);
  }, [provinceId]);

  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = /^9[6-8]\d{8}$/.test(phoneDigits);

  const isFormReady =
    email.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    provinceId &&
    district &&
    cityOrMunicipality.trim() &&
    addressLine.trim() &&
    isPhoneValid;

  const subtotal = getMoney(orderSummary, "subtotalRs", "subtotal");
  const shipping = getMoney(orderSummary, "shippingRs", "shipping");
  const discount = getMoney(orderSummary, "discountRs", "discount");
  const total =
    getMoney(orderSummary, "totalRs", "total") ||
    Math.max(0, subtotal + shipping - discount);

  const cartHasStockIssue = React.useMemo(
    () => hasStockIssue(checkoutItems),
    [checkoutItems]
  );

  const showToast = React.useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  React.useEffect(() => {
    try {
      const cartRaw = localStorage.getItem(CART_KEY);
      const summaryRaw = localStorage.getItem(ORDER_SUMMARY_KEY);

      const cart = sanitizeCheckoutItems(cartRaw ? JSON.parse(cartRaw) : []);
      const previousSummary: OrderSummary | null = summaryRaw
        ? JSON.parse(summaryRaw)
        : null;

      if (!cart.length || !previousSummary) {
        showToast("error", t("checkout.cartEmpty"));
        router.replace("/cartpage");
        return;
      }

      if (hasStockIssue(cart)) {
        showToast("error", t("checkout.stockIssues"));
        router.replace("/cartpage");
        return;
      }

      const syncedSummary = buildSummaryFromCart(cart, previousSummary);

      setCheckoutItems(cart);
      setOrderSummary(syncedSummary);

      localStorage.setItem(ORDER_SUMMARY_KEY, JSON.stringify(syncedSummary));
      localStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(cart));
    } catch {
      showToast("error", t("checkout.checkoutDataMissing"));
      router.replace("/cartpage");
    } finally {
      setCartChecked(true);
    }
  }, [router, showToast, t]);

  React.useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json().catch(() => ({} as any));
        const me = data?.user || data?.data?.user || data?.data;
        if (!me) return;

        setEmail(String(me.email || ""));

        const fullName = String(me.name || "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        setFirstName(parts[0] || "");
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
      } catch {
        // ignore
      }
    };

    loadMe();
  }, []);

  React.useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/addresses`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return;

        const json = await res.json().catch(() => ({} as any));
        const shippingRows = Array.isArray(json?.shipping) ? json.shipping : [];
        const def =
          shippingRows.find((x: any) => x.isDefault) || shippingRows[0];

        if (!def) return;

        setEmail(def.email || "");
        setFirstName(def.firstName || "");
        setLastName(def.lastName || "");

        setProvinceId(def.provinceId || "");
        setDistrict(def.district || "");
        setCityOrMunicipality(def.cityOrMunicipality || "");

        setAddressLine(def.addressLine || "");
        setStreet(def.street || "");
        setPostalCode(def.postalCode || "");
        setPhone(def.phone || "");

        if (
          typeof def.lat === "number" &&
          typeof def.lng === "number" &&
          Number.isFinite(def.lat) &&
          Number.isFinite(def.lng)
        ) {
          const pos = { lat: def.lat, lng: def.lng };
          setMapCenter(pos);
          setMarkerPosition(pos);
        }
      } catch {
        // ignore
      }
    };

    loadDefaultAddress();
  }, []);

  const validate = () => {
    if (!email.trim()) return t("checkout.emailRequired");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return t("checkout.validEmail");
    if (!firstName.trim()) return t("checkout.firstNameRequired");
    if (!lastName.trim()) return t("checkout.lastNameRequired");
    if (!provinceId) return t("checkout.provinceRequired");
    if (!district) return t("checkout.districtRequired");
    if (!cityOrMunicipality.trim()) return t("checkout.cityRequired");
    if (!addressLine.trim()) return t("checkout.addressRequired");
    if (!phone.trim()) return t("checkout.phoneRequired");
    if (!isPhoneValid) return t("checkout.validPhone");
    if (!checkoutItems.length) return t("checkout.cartEmpty");
    if (cartHasStockIssue) return t("checkout.stockIssues");

    return "";
  };

  const saveAddressToDB = async () => {
    const payload = {
      type: "Shipping",
      label: "Home",
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: "Nepal",
      provinceId,
      district,
      cityOrMunicipality: cityOrMunicipality.trim(),
      addressLine: addressLine.trim(),
      street: street.trim(),
      postalCode: postalCode.trim(),
      phone: phoneDigits,
      isDefault: true,
      lat: markerPosition.lat,
      lng: markerPosition.lng,
    };

    const res = await fetch(`${API_BASE}/api/addresses`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({} as any));

    if (!res.ok || !json?.success) {
      throw new Error(json?.message || t("checkout.failedSaveAddress"));
    }

    return json?.data;
  };

  const handleMarkerDragEnd = (e: any) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();

    if (typeof lat !== "number" || typeof lng !== "number") return;

    setMarkerPosition({ lat, lng });
    setMapCenter({ lat, lng });
    showToast("info", t("checkout.mapPinUpdated"));
  };

  const handleUseCurrentLocation = () => {
    setError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationLoading(false);
      setError(t("checkout.geolocationNotSupported"));
      showToast("error", t("checkout.geolocationNotSupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        setLocationLoading(false);
        showToast("success", t("checkout.currentLocationDetected"));
      },
      () => {
        setLocationLoading(false);
        setError(t("checkout.unableCurrentLocation"));
        showToast("error", t("checkout.unableCurrentLocation"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const handleContinue = async () => {
    setError("");

    const msg = validate();

    if (msg) {
      setError(msg);
      showToast("error", msg);
      return;
    }

    setSaving(true);

    try {
      let savedAddress: any = null;

      if (saveForNextTime) {
        savedAddress = await saveAddressToDB();
      }

      const checkoutAddress = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        country: "Nepal",
        provinceId,
        provinceName: selectedProvince?.name || "",
        district,
        cityOrMunicipality: cityOrMunicipality.trim(),
        addressLine: addressLine.trim(),
        street: street.trim(),
        postalCode: postalCode.trim(),
        phone: phoneDigits,
        marketingOptIn,
        savedAddressId: savedAddress?.id || savedAddress?._id || null,
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      };

      const syncedSummary = buildSummaryFromCart(checkoutItems, orderSummary);

      localStorage.setItem(
        CHECKOUT_ADDRESS_KEY,
        JSON.stringify(checkoutAddress)
      );
      localStorage.setItem("checkout_address", JSON.stringify(checkoutAddress));
      localStorage.setItem(CHECKOUT_ITEMS_KEY, JSON.stringify(checkoutItems));
      localStorage.setItem(ORDER_SUMMARY_KEY, JSON.stringify(syncedSummary));

      showToast("success", t("checkout.addressSavedPayment"));
      router.push("/payment");
    } catch (e: any) {
      const msg = e?.message || t("checkout.somethingWrong");
      setError(msg);
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  if (!cartChecked) {
    return (
      <>
        <CartHeader backHref="/cartpage" />

        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 text-white">
          <div className="rounded-[24px] border border-[#26293a] bg-[#11121a] px-6 py-4 text-sm font-semibold text-[#cbd5f5] shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            {t("checkout.preparingCheckout")}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <CartHeader backHref="/cartpage" />

      {toast ? (
        <div className="fixed right-4 top-24 z-[80] w-[calc(100%-32px)] max-w-[360px]">
          <div
            className={`rounded-[18px] border px-4 py-3 text-[13px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                : toast.type === "error"
                  ? "border-red-400/30 bg-red-500/15 text-red-100"
                  : "border-blue-400/30 bg-blue-500/15 text-blue-100"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#a7aec4]">
              <Link href="/cartpage" className="hover:text-white">
                {t("checkout.cart")}
              </Link>

              <span>/</span>

              <span className="text-white">{t("checkout.information")}</span>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-[#26293a] bg-[#11121a] p-3 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4]">
              <div className="flex items-center gap-2 text-white">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#090a12]">
                  1
                </span>
                {t("checkout.cart")}
              </div>

              <div className="h-px flex-1 bg-[#2b3042]" />

              <div className="flex items-center gap-2 text-white">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#090a12]">
                  2
                </span>
                {t("checkout.information")}
              </div>

              <div className="h-px flex-1 bg-[#2b3042]" />

              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[#2b3042]">
                  3
                </span>
                {t("checkout.payment")}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              {t("checkout.checkout")}
            </div>

            <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              {t("checkout.deliveryInformation")}
            </h1>

            <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              {t("checkout.deliveryInfoDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className={`${panelClass} p-5 sm:p-7`}>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                {t("checkout.contactDetails")}
              </h2>

              {error ? (
                <div className="mt-4 rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {loadError ? (
                <div className="mt-4 rounded-[18px] border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                  {t("checkout.mapsFailed")}
                </div>
              ) : null}

              <div className="mt-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-[13px] text-[#cfd3ff]"
                >
                  {t("checkout.email")}
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder={t("checkout.emailAddress")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <label className="mt-4 flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="h-4 w-4 accent-white"
                />
                {t("checkout.marketingOptIn")}
              </label>

              <div className="mt-9">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                  {t("checkout.shippingAddress")}
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      {t("checkout.firstName")}
                    </label>

                    <input
                      id="firstName"
                      placeholder={t("checkout.firstName")}
                      className={inputClass}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      {t("checkout.lastName")}
                    </label>

                    <input
                      id="lastName"
                      placeholder={t("checkout.lastName")}
                      className={inputClass}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="country"
                    className="mb-2 block text-[13px] text-[#cfd3ff]"
                  >
                    {t("checkout.country")}
                  </label>

                  <input
                    id="country"
                    value="Nepal"
                    disabled
                    className={inputClass}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="province"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      {t("checkout.province")}
                    </label>

                    <select
                      id="province"
                      value={provinceId}
                      onChange={(e) => {
                        setProvinceId(e.target.value);
                        setDistrict("");
                        setCityOrMunicipality("");
                      }}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">{t("checkout.selectProvince")}</option>
                      {NEPAL_PROVINCES.map((p: Province) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="district"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      {t("checkout.district")}
                    </label>

                    <select
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={!provinceId}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">
                        {provinceId
                          ? t("checkout.selectDistrict")
                          : t("checkout.selectProvinceFirst")}
                      </option>

                      {districtsForProvince.map((d: District) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="cityOrMunicipality"
                    className="mb-2 block text-[13px] text-[#cfd3ff]"
                  >
                    {t("checkout.cityMunicipality")}
                  </label>

                  <input
                    id="cityOrMunicipality"
                    value={cityOrMunicipality}
                    onChange={(e) => setCityOrMunicipality(e.target.value)}
                    placeholder={t("checkout.cityMunicipality")}
                    disabled={!district}
                    className={inputClass}
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="addressLine"
                    className="mb-2 block text-[13px] text-[#cfd3ff]"
                  >
                    {t("checkout.address")}
                  </label>

                  <input
                    id="addressLine"
                    placeholder={t("checkout.address")}
                    className={inputClass}
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="street"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      {t("checkout.street")}
                    </label>

                    <input
                      id="street"
                      placeholder={t("checkout.street")}
                      className={inputClass}
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="postalCode"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      {t("checkout.postalCode")}
                    </label>

                    <input
                      id="postalCode"
                      placeholder={t("checkout.postalCode")}
                      className={inputClass}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-[13px] text-[#cfd3ff]"
                  >
                    {t("checkout.phoneNumber")}
                  </label>

                  <input
                    id="phone"
                    placeholder="98XXXXXXXX"
                    className={inputClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  {phone && !isPhoneValid ? (
                    <p className="mt-2 text-[12px] text-red-300">
                      {t("checkout.validPhone")}
                    </p>
                  ) : null}
                </div>

                <label className="mt-4 flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                  <input
                    type="checkbox"
                    checked={saveForNextTime}
                    onChange={(e) => setSaveForNextTime(e.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                  {t("checkout.saveForNextTime")}
                </label>
              </div>
            </section>

            <aside className="lg:sticky lg:top-[104px] lg:self-start">
              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  {t("checkout.location")}
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  {t("checkout.deliveryMap")}
                </h2>

                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                  {t("checkout.deliveryMapDesc")}
                </p>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                  className={`${secondaryBtnClass} mt-5 w-full`}
                >
                  {locationLoading
                    ? t("checkout.detectingLocation")
                    : t("checkout.useCurrentLocation")}
                </button>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      {t("checkout.latitude")}
                    </div>

                    <div className="mt-1 text-[15px] font-semibold text-white">
                      {markerPosition.lat.toFixed(6)}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      {t("checkout.longitude")}
                    </div>

                    <div className="mt-1 text-[15px] font-semibold text-white">
                      {markerPosition.lng.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824]">
                  {!GOOGLE_MAPS_API_KEY ? (
                    <div className="flex h-[340px] items-center justify-center px-5 text-center text-[14px] leading-6 text-yellow-100">
                      {t("checkout.mapsNotConfigured")}
                    </div>
                  ) : isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{
                        width: "100%",
                        height: "340px",
                      }}
                      center={mapCenter}
                      zoom={15}
                      onLoad={() => setMapLoaded(true)}
                      options={{
                        fullscreenControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                      }}
                    >
                      <Marker
                        position={markerPosition}
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                      />
                    </GoogleMap>
                  ) : (
                    <div className="flex h-[340px] items-center justify-center text-[14px] text-[#a7aec4]">
                      {t("checkout.loadingGoogleMaps")}
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[12px] leading-5 text-[#7f88b3]">
                  {mapLoaded ? t("checkout.mapTip") : t("checkout.mapDefaultTip")}
                </div>

                <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7f88b3]">
                    {t("checkout.selectedAddress")}
                  </div>

                  <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#cfd3ff]">
                    <p>
                      <span className="text-[#7f88b3]">
                        {t("checkout.name")}:
                      </span>{" "}
                      {firstName || lastName
                        ? `${firstName} ${lastName}`.trim()
                        : t("checkout.notAdded")}
                    </p>

                    <p>
                      <span className="text-[#7f88b3]">
                        {t("checkout.address")}:
                      </span>{" "}
                      {addressLine || t("checkout.notAdded")}
                    </p>

                    <p>
                      <span className="text-[#7f88b3]">
                        {t("checkout.area")}:
                      </span>{" "}
                      {[cityOrMunicipality, district, selectedProvince?.name]
                        .filter(Boolean)
                        .join(", ") || t("checkout.notSelected")}
                    </p>

                    <p>
                      <span className="text-[#7f88b3]">
                        {t("checkout.phoneNumber")}:
                      </span>{" "}
                      {phone || t("checkout.notAdded")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7f88b3]">
                    {t("checkout.orderSummary")}
                  </div>

                  <div className="mt-4 space-y-3 text-[14px] text-[#a7aec4]">
                    <div className="flex items-center justify-between gap-4">
                      <span>{t("checkout.items")}</span>
                      <span className="text-white">
                        {orderSummary?.itemCount ||
                          getCartCount(checkoutItems) ||
                          "-"}
                      </span>
                    </div>

                    {checkoutItems.length > 0 ? (
                      <div className="max-h-[220px] space-y-3 overflow-y-auto border-y border-[#26293a] py-3 pr-1">
                        {checkoutItems.map((item) => (
                          <div
                            key={`${item.productId}-${item.variantId || item.size}-${item.color}`}
                            className="rounded-[16px] border border-[#26293a] bg-[#0d0f17] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-semibold text-white">
                                  {item.name}
                                </div>

                                <div className="mt-1 text-[11px] text-[#7f88b3]">
                                  {item.colorLabel || item.color} /{" "}
                                  {item.size || "-"} × {item.qty}
                                </div>

                                {item.sku ? (
                                  <div className="mt-1 text-[11px] text-[#7f88b3]">
                                    SKU: {item.sku}
                                  </div>
                                ) : null}
                              </div>

                              <div className="shrink-0 text-right text-[12px] font-semibold text-[#d6c7ff]">
                                {formatMoney(item.price * item.qty)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4">
                      <span>{t("checkout.subtotal")}</span>
                      <span className="text-white">{formatMoney(subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>{t("checkout.shipping")}</span>
                      <span className="text-white">{formatMoney(shipping)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>
                        {t("checkout.discount")}{" "}
                        {orderSummary?.couponCode
                          ? `(${orderSummary.couponCode})`
                          : ""}
                      </span>
                      <span className="text-white">
                        - {formatMoney(discount)}
                      </span>
                    </div>

                    <div className="border-t border-[#26293a] pt-3">
                      <div className="flex items-center justify-between gap-4 text-[16px] font-semibold text-white">
                        <span>{t("checkout.total")}</span>
                        <span>{formatMoney(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={saving || !isFormReady || cartHasStockIssue}
                  className={`${primaryBtnClass} mt-6 w-full`}
                >
                  {saving
                    ? t("checkout.saving")
                    : cartHasStockIssue
                      ? t("checkout.fixCartStock")
                      : t("checkout.continueToPayment")}
                </button>

                {!isFormReady ? (
                  <p className="mt-3 text-center text-[12px] text-[#7f88b3]">
                    {t("checkout.fillRequired")}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MainFooter />
    </>
  );
}