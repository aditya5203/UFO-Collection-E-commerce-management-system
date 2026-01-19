// app/checkout/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  type Province,
  type District,
} from "../data/nepalLocations";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function CheckoutPage() {
  const router = useRouter();

  // ------------------ state ------------------
  const [provinceId, setProvinceId] = React.useState<string>("");
  const [district, setDistrict] = React.useState<string>("");
  const [cityOrMunicipality, setCityOrMunicipality] = React.useState<string>("");

  const [email, setEmail] = React.useState<string>("");
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");

  const [addressLine, setAddressLine] = React.useState<string>("");
  const [street, setStreet] = React.useState<string>("");
  const [postalCode, setPostalCode] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");

  const [saveForNextTime, setSaveForNextTime] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  // ------------------ derived ------------------
  const districtsForProvince: District[] = React.useMemo(() => {
    return NEPAL_DISTRICTS.filter((d) => d.provinceId === provinceId);
  }, [provinceId]);

  // ✅ Fetch current user
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

  // ✅ Optional: load default address
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

  const handleContinue = async () => {
    setError("");

    const msg = validate();
    if (msg) return setError(msg);

    setSaving(true);
    try {
      let savedAddress: any = null;
      if (saveForNextTime) savedAddress = await saveAddressToDB();

      const checkoutAddress = {
        email,
        firstName,
        lastName,
        country: "Nepal",
        provinceId,
        district,
        cityOrMunicipality,
        addressLine,
        street,
        postalCode,
        phone,
        savedAddressId: savedAddress?.id || savedAddress?._id || null,
      };

      localStorage.setItem("checkout_address", JSON.stringify(checkoutAddress));

      // ✅ IMPORTANT: do not change ufo_order_summary here
      router.push("/payment");
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/cartpage")}
              className="flex items-center gap-2 text-[14px] text-[#cfd3ff] hover:text-white"
            >
              <Image
                src="/images/backarrow.png"
                alt="Back"
                width={18}
                height={18}
                className="brightness-0 invert"
              />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border border-white">
                <Image src="/images/logo.png" alt="UFO Collection" width={48} height={48} />
              </div>
              <span className="text-[26px] font-semibold tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </div>
          </div>

          <nav className="hidden gap-10 md:flex">
            {["HOME", "COLLECTION", "ABOUT", "CONTACT"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-[14px] tracking-[0.16em] text-[#9aa3cc] hover:text-white"
              >
                {item}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            className="rounded-md p-1 hover:bg-[#12182a]"
            aria-label="Wishlist"
            title="Wishlist"
          >
            <Image
              src="/images/wishlist.png"
              alt=""
              width={26}
              height={26}
              className="brightness-0 invert"
            />
          </button>
        </div>
      </header>

      {/* BODY */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1160px] px-4 py-10">
          <div className="mb-10 text-[14px] text-[#9aa3cc]">
            Cart <span className="mx-2">/</span>
            <span className="text-white">Information</span>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px]">
            <section className="max-w-[520px]">
              <h2 className="mb-4 text-[20px] font-semibold">Contact</h2>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-3 h-[48px] w-full rounded-[10px] border border-[#2b2f45] bg-[#0b1623] px-4 text-[14px] text-white placeholder:text-[#7f88b3]"
              />

              <label className="flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                <input type="checkbox" />
                Email me with news and offers
              </label>

              <h2 className="mt-10 mb-4 text-[20px] font-semibold">Shipping address</h2>

              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="First name"
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  placeholder="Last name"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <input value="Nepal" disabled className="input mt-4 text-[#cfd3ff]" />

              <select
                value={provinceId}
                onChange={(e) => {
                  setProvinceId(e.target.value);
                  setDistrict("");
                  setCityOrMunicipality("");
                }}
                className="input mt-4"
              >
                <option value="">Select Province</option>
                {NEPAL_PROVINCES.map((p: Province) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!provinceId}
                className="input mt-4 disabled:opacity-60"
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

              <input
                value={cityOrMunicipality}
                onChange={(e) => setCityOrMunicipality(e.target.value)}
                placeholder="City / Municipality"
                disabled={!district}
                className="input mt-4 disabled:opacity-60"
              />

              <input
                placeholder="Address"
                className="input mt-4"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />

              <div className="mt-4 grid grid-cols-2 gap-4">
                <input
                  placeholder="Street"
                  className="input"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
                <input
                  placeholder="Postal code"
                  className="input"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>

              <input
                placeholder="Phone number"
                className="input mt-4"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <label className="mt-4 flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                <input
                  type="checkbox"
                  checked={saveForNextTime}
                  onChange={(e) => setSaveForNextTime(e.target.checked)}
                />
                Save this information for next time
              </label>
            </section>

            <aside className="flex items-end justify-end">
              <button
                onClick={handleContinue}
                disabled={saving}
                className="rounded-[10px] bg-[#1f7cff] px-8 py-4 text-[15px] font-semibold text-white hover:bg-[#2a86ff] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Continue to Payment"}
              </button>
            </aside>
          </div>

          <div className="mt-24 text-center text-[13px] text-[#8b90ad]">
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
        }
        .input::placeholder {
          color: #7f88b3;
        }
      `}</style>
    </>
  );
}
