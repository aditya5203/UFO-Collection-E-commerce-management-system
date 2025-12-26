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

export default function CheckoutPage() {
  const router = useRouter();

  // ------------------ state ------------------
  const [provinceId, setProvinceId] = React.useState<string>("");
  const [district, setDistrict] = React.useState<string>("");
  const [cityOrMunicipality, setCityOrMunicipality] = React.useState<string>("");

  // ✅ Autofill fields from DB
  const [email, setEmail] = React.useState<string>("");
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");

  // ------------------ derived ------------------
  const districtsForProvince: District[] = React.useMemo(() => {
    return NEPAL_DISTRICTS.filter((d) => d.provinceId === provinceId);
  }, [provinceId]);

  // ✅ Fetch current user (cookie-based auth)
  React.useEffect(() => {
    const loadMe = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include", // ✅ sends httpOnly cookie token
        });

        if (!res.ok) return;

        const data = await res.json();

        if (!data?.success || !data?.user) return;

        const user = data.user as { email?: string; name?: string };

        // Email
        setEmail(user.email || "");

        // Split full name into first + last name
        const fullName = (user.name || "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);

        setFirstName(parts[0] || "");
        setLastName(parts.length > 1 ? parts.slice(1).join(" ") : "");
      } catch {
        // ignore
      }
    };

    loadMe();
  }, []);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] max-w-[1160px] items-center justify-between px-4">
          {/* Left */}
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
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection"
                  width={48}
                  height={48}
                />
              </div>
              <span className="text-[26px] font-semibold tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </div>
          </div>

          {/* Center nav */}
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

          {/* Right */}
          <button
            type="button"
            onClick={() => router.push("/cartpage")}
            aria-label="Wishlist"
            title="Wishlist"
            className="rounded-md p-1 hover:bg-[#12182a]"
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

      {/* ================= BODY ================= */}
      <main className="min-h-[calc(100vh-80px)] bg-[#070a12] text-white">
        <div className="mx-auto max-w-[1160px] px-4 py-10">
          {/* Breadcrumb */}
          <div className="mb-10 text-[14px] text-[#9aa3cc]">
            Cart <span className="mx-2">/</span>
            <span className="text-white">Information</span>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px]">
            {/* ================= LEFT FORM ================= */}
            <section className="max-w-[520px]">
              {/* Contact */}
              <h2 className="mb-4 text-[20px] font-semibold">Contact</h2>

              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
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

              {/* Shipping */}
              <h2 className="mt-10 mb-4 text-[20px] font-semibold">
                Shipping address
              </h2>

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

              {/* Country */}
              <label htmlFor="country" className="sr-only">
                Country
              </label>
              <input
                id="country"
                value="Nepal"
                disabled
                className="input mt-4 text-[#cfd3ff]"
              />

              {/* Province */}
              <label htmlFor="province" className="sr-only">
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
                className="input mt-4"
              >
                <option value="">Select Province</option>
                {NEPAL_PROVINCES.map((p: Province) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* District */}
              <label htmlFor="district" className="sr-only">
                District
              </label>
              <select
                id="district"
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

              {/* City / Municipality */}
              <label htmlFor="city" className="sr-only">
                City or Municipality
              </label>
              <input
                id="city"
                value={cityOrMunicipality}
                onChange={(e) => setCityOrMunicipality(e.target.value)}
                placeholder="City / Municipality"
                disabled={!district}
                className="input mt-4 disabled:opacity-60"
              />

              <input placeholder="Address" className="input mt-4" />

              <div className="mt-4 grid grid-cols-2 gap-4">
                <input placeholder="Street" className="input" />
                <input placeholder="Postal code" className="input" />
              </div>

              <input placeholder="Phone number" className="input mt-4" />

              <label className="mt-4 flex items-center gap-3 text-[14px] text-[#cfd3ff]">
                <input type="checkbox" />
                Save this information for next time
              </label>
            </section>

            {/* ================= RIGHT ACTION ================= */}
            <aside className="flex items-end justify-end">
              <button
                onClick={() => router.push("/payment")}
                className="rounded-[10px] bg-[#1f7cff] px-8 py-4 text-[15px] font-semibold text-white hover:bg-[#2a86ff]"
              >
                Continue to Payment
              </button>
            </aside>
          </div>

          {/* Footer */}
          <div className="mt-24 text-center text-[13px] text-[#8b90ad]">
            © 2025 UFO Collection — All Rights Reserved
          </div>
        </div>
      </main>

      {/* Tailwind helper */}
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
