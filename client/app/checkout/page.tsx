"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";

import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  type Province,
  type District,
} from "../data/nepalLocations";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

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
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
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
};

function formatMoney(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function getMoney(summary: OrderSummary | null, rsKey: keyof OrderSummary, key: keyof OrderSummary) {
  const rsValue = Number(summary?.[rsKey]);
  if (Number.isFinite(rsValue) && rsValue > 0) return rsValue;

  const rawValue = Number(summary?.[key]);
  if (Number.isFinite(rawValue) && rawValue > 0) return rawValue;

  return 0;
}

export default function CheckoutPage() {
  const router = useRouter();

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
  const isPhoneValid = phoneDigits.length === 10;

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

  const showToast = React.useCallback((type: Toast["type"], message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("ufo_order_summary");
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setOrderSummary(parsed);
    } catch {
      setOrderSummary(null);
    }
  }, []);

  React.useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: "GET",
          credentials: "include",
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
        });

        if (!res.ok) return;

        const json = await res.json().catch(() => ({} as any));
        const shippingRows = Array.isArray(json?.shipping) ? json.shipping : [];
        const def = shippingRows.find((x: any) => x.isDefault) || shippingRows[0];

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
    if (!email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email";
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!provinceId) return "Province is required";
    if (!district) return "District is required";
    if (!cityOrMunicipality.trim()) return "City/Municipality is required";
    if (!addressLine.trim()) return "Address is required";
    if (!phone.trim()) return "Phone number is required";
    if (!isPhoneValid) return "Phone number must be 10 digits";
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
      phone: phone.trim(),
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
      throw new Error(json?.message || "Failed to save address");
    }

    return json?.data;
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();

    if (typeof lat !== "number" || typeof lng !== "number") return;

    setMarkerPosition({ lat, lng });
    setMapCenter({ lat, lng });
    showToast("info", "Delivery map pin updated");
  };

  const handleUseCurrentLocation = () => {
    setError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setLocationLoading(false);
      setError("Geolocation is not supported in this browser");
      showToast("error", "Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        setLocationLoading(false);
        showToast("success", "Current location detected");
      },
      () => {
        setLocationLoading(false);
        setError("Unable to fetch your current location");
        showToast("error", "Unable to fetch your current location");
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
        country: "Nepal",
        provinceId,
        provinceName: selectedProvince?.name || "",
        district,
        cityOrMunicipality: cityOrMunicipality.trim(),
        addressLine: addressLine.trim(),
        street: street.trim(),
        postalCode: postalCode.trim(),
        phone: phone.trim(),
        marketingOptIn,
        savedAddressId: savedAddress?.id || savedAddress?._id || null,
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      };

      localStorage.setItem("checkout_address", JSON.stringify(checkoutAddress));
      showToast("success", "Address saved. Continuing to payment...");
      router.push("/payment");
    } catch (e: any) {
      const msg = e?.message || "Something went wrong";
      setError(msg);
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <CartHeader />

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
                Cart
              </Link>
              <span>/</span>
              <span className="text-white">Information</span>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-[#26293a] bg-[#11121a] p-3 text-[12px] uppercase tracking-[0.14em] text-[#a7aec4]">
              <div className="flex items-center gap-2 text-white">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#090a12]">
                  1
                </span>
                Cart
              </div>
              <div className="h-px flex-1 bg-[#2b3042]" />
              <div className="flex items-center gap-2 text-white">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#090a12]">
                  2
                </span>
                Information
              </div>
              <div className="h-px flex-1 bg-[#2b3042]" />
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[#2b3042]">
                  3
                </span>
                Payment
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
              Checkout
            </div>
            <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              Delivery Information
            </h1>
            <p className="mt-2 max-w-[620px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
              Add your contact details, shipping address, and exact map pin for
              smooth delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className={`${panelClass} p-5 sm:p-7`}>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                Contact Details
              </h2>

              {error ? (
                <div className="mt-4 rounded-[18px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {loadError ? (
                <div className="mt-4 rounded-[18px] border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                  Google Maps failed to load. Check your API key and allowed
                  referrers.
                </div>
              ) : null}

              <div className="mt-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-[13px] text-[#cfd3ff]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email address"
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
                Email me with news and offers
              </label>

              <div className="mt-9">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                  Shipping Address
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-[13px] text-[#cfd3ff]"
                    >
                      First name
                    </label>
                    <input
                      id="firstName"
                      placeholder="First name"
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
                      Last name
                    </label>
                    <input
                      id="lastName"
                      placeholder="Last name"
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
                    Country
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
                      Province
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
                      <option value="">Select Province</option>
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
                      District
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
                          ? "Select District"
                          : "Select Province first"}
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
                    City / Municipality
                  </label>
                  <input
                    id="cityOrMunicipality"
                    value={cityOrMunicipality}
                    onChange={(e) => setCityOrMunicipality(e.target.value)}
                    placeholder="City / Municipality"
                    disabled={!district}
                    className={inputClass}
                  />
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="addressLine"
                    className="mb-2 block text-[13px] text-[#cfd3ff]"
                  >
                    Address
                  </label>
                  <input
                    id="addressLine"
                    placeholder="Address"
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
                      Street
                    </label>
                    <input
                      id="street"
                      placeholder="Street"
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
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      placeholder="Postal code"
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
                    Phone number
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
                      Phone number must be 10 digits.
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
                  Save this information for next time
                </label>
              </div>
            </section>

            <aside className="lg:sticky lg:top-[104px] lg:self-start">
              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Location
                </div>
                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Delivery Map
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                  Use current location or drag the map pin to set the exact
                  delivery spot.
                </p>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                  className={`${secondaryBtnClass} mt-5 w-full justify-center`}
                >
                  {locationLoading ? "Detecting Location..." : "Use Current Location"}
                </button>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      Latitude
                    </div>
                    <div className="mt-1 text-[15px] font-semibold text-white">
                      {markerPosition.lat.toFixed(6)}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      Longitude
                    </div>
                    <div className="mt-1 text-[15px] font-semibold text-white">
                      {markerPosition.lng.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[20px] border border-[#26293a] bg-[#161824]">
                  {isLoaded ? (
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
                      Loading Google Maps...
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[12px] leading-5 text-[#7f88b3]">
                  {mapLoaded
                    ? "Tip: drag the pin for exact delivery location."
                    : "Map is loading..."}
                </div>

                <div className="mt-6 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7f88b3]">
                    Selected Address
                  </div>

                  <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#cfd3ff]">
                    <p>
                      <span className="text-[#7f88b3]">Name:</span>{" "}
                      {firstName || lastName
                        ? `${firstName} ${lastName}`.trim()
                        : "Not added"}
                    </p>
                    <p>
                      <span className="text-[#7f88b3]">Address:</span>{" "}
                      {addressLine || "Not added"}
                    </p>
                    <p>
                      <span className="text-[#7f88b3]">Area:</span>{" "}
                      {[cityOrMunicipality, district, selectedProvince?.name]
                        .filter(Boolean)
                        .join(", ") || "Not selected"}
                    </p>
                    <p>
                      <span className="text-[#7f88b3]">Phone:</span>{" "}
                      {phone || "Not added"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#7f88b3]">
                    Order Summary
                  </div>

                  <div className="mt-4 space-y-3 text-[14px] text-[#a7aec4]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Items</span>
                      <span className="text-white">
                        {orderSummary?.itemCount || "-"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>Subtotal</span>
                      <span className="text-white">{formatMoney(subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>Shipping</span>
                      <span className="text-white">{formatMoney(shipping)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>Discount</span>
                      <span className="text-white">- {formatMoney(discount)}</span>
                    </div>

                    <div className="border-t border-[#26293a] pt-3">
                      <div className="flex items-center justify-between gap-4 text-[16px] font-semibold text-white">
                        <span>Total</span>
                        <span>{formatMoney(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={saving || !isFormReady}
                  className={`${primaryBtnClass} mt-6 w-full justify-center`}
                >
                  {saving ? "Saving..." : "Continue to Payment"}
                </button>

                {!isFormReady ? (
                  <p className="mt-3 text-center text-[12px] text-[#7f88b3]">
                    Fill all required fields to continue.
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