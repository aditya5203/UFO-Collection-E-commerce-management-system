"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

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
  lng: 85.324, // Kathmandu
};

type LatLng = {
  lat: number;
  lng: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [provinceId, setProvinceId] = React.useState<string>("");
  const [district, setDistrict] = React.useState<string>("");
  const [cityOrMunicipality, setCityOrMunicipality] =
    React.useState<string>("");

  const [email, setEmail] = React.useState<string>("");
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");

  const [addressLine, setAddressLine] = React.useState<string>("");
  const [street, setStreet] = React.useState<string>("");
  const [postalCode, setPostalCode] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");

  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [saveForNextTime, setSaveForNextTime] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>("");

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
        const shipping = Array.isArray(json?.shipping) ? json.shipping : [];
        const def = shipping.find((x: any) => x.isDefault) || shipping[0];
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
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!provinceId) return "Province is required";
    if (!district) return "District is required";
    if (!cityOrMunicipality.trim()) return "City/Municipality is required";
    if (!addressLine.trim()) return "Address is required";
    if (!phone.trim()) return "Phone number is required";
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
  };

  const handleUseCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
      },
      () => {
        setError("Unable to fetch your current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleContinue = async () => {
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    try {
      let savedAddress: any = null;
      if (saveForNextTime) savedAddress = await saveAddressToDB();

      const checkoutAddress = {
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
        marketingOptIn,
        savedAddressId: savedAddress?.id || savedAddress?._id || null,
        lat: markerPosition.lat,
        lng: markerPosition.lng,
      };

      localStorage.setItem("checkout_address", JSON.stringify(checkoutAddress));
      router.push("/payment");
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex min-h-[80px] max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push("/cartpage")}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-2 text-[13px] text-[#cfd3ff] transition hover:bg-white hover:text-[#050611]"
              aria-label="Back to cart"
              title="Back to cart"
            >
              <Image
                src="/images/backarrow.png"
                alt="Back"
                width={18}
                height={18}
                className="brightness-0 invert"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex min-w-0 items-center gap-3">
              <div className="h-[42px] w-[42px] overflow-hidden rounded-full border border-white sm:h-[48px] sm:w-[48px]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="truncate text-[16px] font-semibold tracking-[0.14em] text-white sm:text-[22px] lg:text-[26px]">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 md:flex lg:gap-10">
            <Link
              href="/homepage"
              className="text-[14px] tracking-[0.16em] text-[#9aa3cc] transition hover:text-white"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[14px] tracking-[0.16em] text-[#9aa3cc] transition hover:text-white"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[14px] tracking-[0.16em] text-[#9aa3cc] transition hover:text-white"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[14px] tracking-[0.16em] text-[#9aa3cc] transition hover:text-white"
            >
              CONTACT
            </Link>
          </nav>

          <Link
            href="/wishlist"
            className="rounded-md p-1 transition hover:bg-[#12182a]"
            aria-label="Go to wishlist"
            title="Go to wishlist"
          >
            <Image
              src="/images/wishlist.png"
              alt="Wishlist"
              width={26}
              height={26}
              className="brightness-0 invert"
            />
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8 text-[13px] text-[#9aa3cc] sm:mb-10 sm:text-[14px]">
            <Link href="/cartpage" className="hover:text-white">
              Cart
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Information</span>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-12">
            <section className="w-full max-w-[680px]">
              <h2 className="mb-4 text-[20px] font-semibold">Contact</h2>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {loadError ? (
                <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                  Google Maps failed to load. Check your API key and allowed
                  referrers.
                </div>
              ) : null}

              <div className="mb-3">
                <label
                  htmlFor="email"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>

              <label className="flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="h-4 w-4 rounded border border-[#2b2f45] bg-[#0b1623]"
                />
                Email me with news and offers
              </label>

              <h2 className="mb-4 mt-10 text-[20px] font-semibold">
                Shipping address
              </h2>

              {isLoaded ? (
                <div className="mb-6 rounded-[16px] border border-[#1f2a40] bg-[#0b1623] p-4 sm:p-5">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-[16px] font-semibold text-white">
                        Pick delivery location
                      </h3>
                      <p className="mt-1 text-[13px] text-[#9aa3cc]">
                        Use current location or drag the pin to set the exact
                        delivery spot.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="rounded-[10px] border border-[#2b2f45] px-4 py-2 text-[13px] font-medium text-[#cfd3ff] transition hover:bg-[#12182a] hover:text-white"
                    >
                      Use current location
                    </button>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-[12px] border border-[#1f2a40] bg-[#08111d] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                        Latitude
                      </div>
                      <div className="mt-1 text-[15px] font-semibold text-white">
                        {markerPosition.lat.toFixed(6)}
                      </div>
                    </div>

                    <div className="rounded-[12px] border border-[#1f2a40] bg-[#08111d] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                        Longitude
                      </div>
                      <div className="mt-1 text-[15px] font-semibold text-white">
                        {markerPosition.lng.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[14px] border border-[#1f2a40]">
                    <GoogleMap
                      mapContainerStyle={{
                        width: "100%",
                        height: "360px",
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
                  </div>

                  <div className="mt-3 text-[12px] text-[#7f88b3]">
                    {mapLoaded
                      ? "Tip: drag the pin for exact delivery location. Latitude and longitude will be saved automatically."
                      : "Loading map..."}
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-[16px] border border-[#1f2a40] bg-[#0b1623] p-4 text-[14px] text-[#9aa3cc]">
                  Loading Google Maps...
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-[14px] text-[#cfd3ff]"
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    placeholder="First name"
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-[14px] text-[#cfd3ff]"
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    placeholder="Last name"
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="country"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
                >
                  Country
                </label>
                <input
                  id="country"
                  value="Nepal"
                  disabled
                  className="input text-[#cfd3ff] opacity-80"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="province"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
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
                  className="input"
                >
                  <option value="">Select Province</option>
                  {NEPAL_PROVINCES.map((p: Province) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="district"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
                >
                  District
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={!provinceId}
                  className="input disabled:opacity-60"
                >
                  <option value="">
                    {provinceId ? "Select District" : "Select Province first"}
                  </option>
                  {districtsForProvince.map((d: District) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="cityOrMunicipality"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
                >
                  City / Municipality
                </label>
                <input
                  id="cityOrMunicipality"
                  value={cityOrMunicipality}
                  onChange={(e) => setCityOrMunicipality(e.target.value)}
                  placeholder="City / Municipality"
                  disabled={!district}
                  className="input disabled:opacity-60"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="addressLine"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
                >
                  Address
                </label>
                <input
                  id="addressLine"
                  placeholder="Address"
                  className="input"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="street"
                    className="mb-2 block text-[14px] text-[#cfd3ff]"
                  >
                    Street
                  </label>
                  <input
                    id="street"
                    placeholder="Street"
                    className="input"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="mb-2 block text-[14px] text-[#cfd3ff]"
                  >
                    Postal code
                  </label>
                  <input
                    id="postalCode"
                    placeholder="Postal code"
                    className="input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="phone"
                  className="mb-2 block text-[14px] text-[#cfd3ff]"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  placeholder="Phone number"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <label className="mt-4 flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                <input
                  type="checkbox"
                  checked={saveForNextTime}
                  onChange={(e) => setSaveForNextTime(e.target.checked)}
                  className="h-4 w-4 rounded border border-[#2b2f45] bg-[#0b1623]"
                />
                Save this information for next time
              </label>

              <div className="mt-8 flex lg:hidden">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={saving}
                  className="w-full rounded-[10px] bg-[#1f7cff] px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-[#2a86ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Continue to Payment"}
                </button>
              </div>
            </section>

            <aside className="lg:sticky lg:top-[110px] lg:self-start">
              <div className="rounded-[16px] border border-[#1f2a40] bg-[#0b1623] p-5 sm:p-6">
                <h3 className="text-[20px] font-semibold text-white">
                  Checkout
                </h3>

                <p className="mt-3 text-[14px] leading-6 text-[#9aa3cc]">
                  Fill in your contact and shipping information to continue to
                  payment.
                </p>

                <div className="mt-6 space-y-3 text-[14px] text-[#cfd3ff]">
                  <div className="flex items-center justify-between gap-4">
                    <span>Country</span>
                    <span className="text-white">Nepal</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Step</span>
                    <span className="text-white">Information</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Map pin</span>
                    <span className="text-right text-white">
                      {markerPosition.lat.toFixed(5)},{" "}
                      {markerPosition.lng.toFixed(5)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={saving}
                  className="mt-8 hidden w-full rounded-[10px] bg-[#1f7cff] px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-[#2a86ff] disabled:cursor-not-allowed disabled:opacity-60 lg:block"
                >
                  {saving ? "Saving..." : "Continue to Payment"}
                </button>
              </div>
            </aside>
          </div>

          <div className="mt-20 text-center text-[13px] text-[#8b90ad]">
            © 2025 UFO Collection — All Rights Reserved
          </div>
        </div>
      </main>

      <style jsx>{`
        .input {
          height: 48px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid #2b2f45;
          background: #0b1623;
          padding: 0 16px;
          font-size: 14px;
          color: white;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input:focus {
          border-color: #4f7fff;
          box-shadow: 0 0 0 3px rgba(79, 127, 255, 0.15);
        }

        .input::placeholder {
          color: #7f88b3;
        }

        .input:disabled {
          cursor: not-allowed;
        }

        select.input {
          appearance: none;
        }
      `}</style>
    </>
  );
}