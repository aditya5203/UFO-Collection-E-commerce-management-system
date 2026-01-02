"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AddressType = "Shipping" | "Billing";
type AddressLabel = "Home" | "Work" | "Other";

type Address = {
  id: string;
  userId?: string;

  type: AddressType;
  label?: AddressLabel;

  email?: string;
  firstName: string;
  lastName: string;

  country?: string; // Nepal
  provinceId: string;
  district: string;
  cityOrMunicipality: string;

  addressLine: string;
  street?: string;
  postalCode?: string;
  phone: string;

  isDefault?: boolean;

  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

function fullName(a: Address) {
  return `${a.firstName || ""} ${a.lastName || ""}`.trim() || "-";
}

function line2(a: Address) {
  const parts = [
    a.addressLine,
    a.street,
    a.cityOrMunicipality,
    a.district,
    a.provinceId,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function AddressPage() {
  const router = useRouter();

  // 3 dots menu
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  // data
  const [loading, setLoading] = React.useState(true);
  const [shipping, setShipping] = React.useState<Address[]>([]);
  const [billing, setBilling] = React.useState<Address[]>([]);
  const [error, setError] = React.useState("");

  // modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [defaultingId, setDefaultingId] = React.useState<string | null>(null);

  const [editing, setEditing] = React.useState<Address | null>(null);

  const [form, setForm] = React.useState<{
    type: AddressType;
    label: AddressLabel;

    email: string;
    firstName: string;
    lastName: string;

    country: string;
    provinceId: string;
    district: string;
    cityOrMunicipality: string;

    addressLine: string;
    street: string;
    postalCode: string;
    phone: string;

    isDefault: boolean;
  }>({
    type: "Shipping",
    label: "Home",

    email: "",
    firstName: "",
    lastName: "",

    country: "Nepal",
    provinceId: "",
    district: "",
    cityOrMunicipality: "",

    addressLine: "",
    street: "",
    postalCode: "",
    phone: "",

    isDefault: false,
  });

  // ✅ Close menu on outside click + ESC
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // ---------------------------
  // API helpers
  // ---------------------------
  const loadAddresses = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/addresses`, { credentials: "include" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json?.success) {
        setShipping([]);
        setBilling([]);
        setError(json?.message || "Failed to load addresses");
        return;
      }

      // Your controller returns: { success:true, shipping, billing }
      const apiShipping = Array.isArray(json?.shipping) ? json.shipping : [];
      const apiBilling = Array.isArray(json?.billing) ? json.billing : [];

      const mapOne = (x: any): Address => ({
        id: String(x?._id || x?.id || ""),
        userId: x?.userId ? String(x.userId) : undefined,

        type: (x?.type || "Shipping") as AddressType,
        label: x?.label,

        email: x?.email || "",
        firstName: x?.firstName || "",
        lastName: x?.lastName || "",

        country: x?.country || "Nepal",
        provinceId: x?.provinceId || "",
        district: x?.district || "",
        cityOrMunicipality: x?.cityOrMunicipality || "",

        addressLine: x?.addressLine || "",
        street: x?.street || "",
        postalCode: x?.postalCode || "",
        phone: x?.phone || "",

        isDefault: Boolean(x?.isDefault),

        createdAt: x?.createdAt,
        updatedAt: x?.updatedAt,
      });

      setShipping(apiShipping.map(mapOne));
      setBilling(apiBilling.map(mapOne));
    } catch {
      setShipping([]);
      setBilling([]);
      setError("Network error while loading addresses");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // ---------------------------
  // Logout (optional)
  // ---------------------------
  const [loggingOut, setLoggingOut] = React.useState(false);
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      router.push("/login");
    }
  };

  // ---------------------------
  // Modal helpers
  // ---------------------------
  const openAdd = (type: AddressType) => {
    setEditing(null);
    setForm({
      type,
      label: "Home",

      email: "",
      firstName: "",
      lastName: "",

      country: "Nepal",
      provinceId: "",
      district: "",
      cityOrMunicipality: "",

      addressLine: "",
      street: "",
      postalCode: "",
      phone: "",

      isDefault: type === "Shipping", // default true for new shipping (optional)
    });
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      type: addr.type,
      label: addr.label || "Home",

      email: addr.email || "",
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",

      country: addr.country || "Nepal",
      provinceId: addr.provinceId || "",
      district: addr.district || "",
      cityOrMunicipality: addr.cityOrMunicipality || "",

      addressLine: addr.addressLine || "",
      street: addr.street || "",
      postalCode: addr.postalCode || "",
      phone: addr.phone || "",

      isDefault: Boolean(addr.isDefault),
    });
    setModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const t = e.target as HTMLInputElement;
      setForm((p) => ({ ...p, [name]: t.checked }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.provinceId.trim()) return "Province is required";
    if (!form.district.trim()) return "District is required";
    if (!form.cityOrMunicipality.trim()) return "City/Municipality is required";
    if (!form.addressLine.trim()) return "Address line is required";
    return "";
  };

  // ---------------------------
  // Create / Update
  // ---------------------------
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateForm();
    if (msg) {
      alert(msg);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        label: form.label,

        email: form.email.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),

        country: (form.country || "Nepal").trim(),
        provinceId: form.provinceId.trim(),
        district: form.district.trim(),
        cityOrMunicipality: form.cityOrMunicipality.trim(),

        addressLine: form.addressLine.trim(),
        street: form.street.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        phone: form.phone.trim(),

        isDefault: Boolean(form.isDefault),
      };

      // CREATE
      if (!editing) {
        const res = await fetch(`${API}/addresses`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({} as any));

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok || !json?.success) {
          alert(json?.message || "Failed to create address");
          return;
        }

        setModalOpen(false);
        setEditing(null);
        await loadAddresses();
        return;
      }

      // UPDATE
      const res = await fetch(`${API}/addresses/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok || !json?.success) {
        alert(json?.message || "Failed to update address");
        return;
      }

      setModalOpen(false);
      setEditing(null);
      await loadAddresses();
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // Delete
  // ---------------------------
  const deleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${API}/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok || !json?.success) {
        alert(json?.message || "Failed to delete address");
        return;
      }

      await loadAddresses();
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------------------
  // Set Default (Shipping/Billing)
  // ---------------------------
  const setDefault = async (id: string) => {
    setDefaultingId(id);
    try {
      const res = await fetch(`${API}/addresses/${id}/default`, {
        method: "PATCH",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok || !json?.success) {
        alert(json?.message || "Failed to set default address");
        return;
      }

      await loadAddresses();
    } finally {
      setDefaultingId(null);
    }
  };

  // ---------------------------
  // UI Components
  // ---------------------------
  const AddressRow = ({ a }: { a: Address }) => (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[15px] font-semibold text-white">{fullName(a)}</div>
          {a.isDefault ? (
            <span className="rounded-full border border-[#2b2f45] bg-white/5 px-3 py-1 text-[11px] text-[#cbd5ff]">
              Default
            </span>
          ) : null}
          {a.label ? (
            <span className="rounded-full border border-[#2b2f45] bg-white/5 px-3 py-1 text-[11px] text-[#8b90ad]">
              {a.label}
            </span>
          ) : null}
        </div>

        <div className="mt-1 text-[13px] text-[#8b90ad]">{a.country || "Nepal"}</div>

        <div className="mt-1 text-[13px] text-[#8b90ad]">{line2(a)}</div>

        <div className="mt-1 text-[13px] text-[#8b90ad]">
          Phone: <span className="text-white/90">{a.phone}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {!a.isDefault ? (
          <button
            type="button"
            onClick={() => setDefault(a.id)}
            disabled={defaultingId === a.id}
            className="rounded-[10px] border border-[#2b2f45] bg-[#1a1d30] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#232844] disabled:opacity-60"
          >
            {defaultingId === a.id ? "Setting..." : "Set Default"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => openEdit(a)}
          className="rounded-[10px] border border-[#2b2f45] bg-[#1a1d30] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#232844]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => deleteAddress(a.id)}
          disabled={deletingId === a.id}
          className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-5 py-2 text-[13px] font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-60"
        >
          {deletingId === a.id ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050611] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
            </Link>
          </nav>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            <Link href="/wishlist" aria-label="Wishlist" title="Wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist"
                className="brightness-0 invert"
              />
            </Link>

            <button
              type="button"
              className="rounded-full border border-[#2b2f45] p-2 hover:bg-white/10"
              onClick={() => router.push("/profile")}
              aria-label="Profile"
            >
              <Image
                src="/images/profile.png"
                width={24}
                height={24}
                alt="Profile"
                className="brightness-0 invert"
              />
            </button>

            <button
              type="button"
              className="rounded-full border border-[#2b2f45] p-2 hover:bg-white/10"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <Image
                src="/images/dots.png"
                width={24}
                height={24}
                alt="Menu"
                className="brightness-0 invert"
              />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[56px] w-[220px] overflow-hidden rounded-[12px] border border-[#23253a] bg-[#101223] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <Link
                  href="/order-tracking"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  Order Tracking
                </Link>

                <Link
                  href="/order-history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  Order History
                </Link>

                <Link
                  href="/address"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  Address
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/language");
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] text-white hover:bg-[#15182a]"
                >
                  Language
                </button>

                <div className="h-px bg-[#23253a]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loggingOut}
                  className="w-full px-4 py-3 text-left text-[13px] text-red-300 hover:bg-[#15182a] disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto w-full max-w-[1160px] px-4 py-10">
        {loading ? (
          <div className="rounded-xl border border-[#22253a] bg-[#101223] p-6 text-[#8b90ad]">
            Loading addresses...
          </div>
        ) : (
          <>
            {error ? (
              <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                {error}
              </div>
            ) : null}

            <h1 className="text-[44px] font-extrabold tracking-tight">
              Address Book
            </h1>

            <div className="mt-8 grid grid-cols-1 gap-10">
              {/* Shipping */}
              <section className="rounded-2xl border border-[#23253a] bg-[#101223] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[18px] font-bold">Shipping Addresses</h2>
                  <button
                    type="button"
                    onClick={() => openAdd("Shipping")}
                    className="rounded-[10px] bg-[#2f7efc] px-5 py-2 text-[13px] font-semibold text-white hover:brightness-105"
                  >
                    Add Shipping
                  </button>
                </div>

                <div className="mt-4 divide-y divide-[#23253a]">
                  {shipping.length ? (
                    shipping.map((a) => <AddressRow key={a.id} a={a} />)
                  ) : (
                    <div className="py-6 text-sm text-[#8b90ad]">
                      No shipping addresses yet.
                    </div>
                  )}
                </div>
              </section>

              {/* Billing */}
              <section className="rounded-2xl border border-[#23253a] bg-[#101223] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[18px] font-bold">Billing Addresses</h2>
                  <button
                    type="button"
                    onClick={() => openAdd("Billing")}
                    className="rounded-[10px] bg-[#2f7efc] px-5 py-2 text-[13px] font-semibold text-white hover:brightness-105"
                  >
                    Add Billing
                  </button>
                </div>

                <div className="mt-4 divide-y divide-[#23253a]">
                  {billing.length ? (
                    billing.map((a) => <AddressRow key={a.id} a={a} />)
                  ) : (
                    <div className="py-6 text-sm text-[#8b90ad]">
                      No billing addresses yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* MODAL */}
      {modalOpen ? (
        // ✅ ONLY CHANGE: make overlay scrollable + start from top so you can reach "Save Address"
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-[760px] rounded-2xl border border-[#23253a] bg-[#101223] shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between border-b border-[#23253a] px-6 py-4">
              <div className="text-[18px] font-bold">
                {editing ? "Edit Address" : "Add Address"}
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
                className="rounded-full border border-[#2b2f45] px-3 py-1 text-sm text-[#cbd5ff] hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[12px] text-[#8b90ad]">Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  >
                    <option value="Shipping">Shipping</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">Label</label>
                  <select
                    name="label"
                    value={form.label}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[12px] text-[#8b90ad]">
                    Email (optional)
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="email@example.com"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99]"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    First Name *
                  </label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    placeholder="First name"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99]"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    Last Name *
                  </label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    placeholder="Last name"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99]"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">Phone *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="98xxxxxxxx"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99]"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">Country</label>
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleFormChange}
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    ProvinceId *
                  </label>
                  <input
                    name="provinceId"
                    value={form.provinceId}
                    onChange={handleFormChange}
                    placeholder="province-1 / bagmati / etc"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">District *</label>
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleFormChange}
                    placeholder="Kathmandu"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    City/Municipality *
                  </label>
                  <input
                    name="cityOrMunicipality"
                    value={form.cityOrMunicipality}
                    onChange={handleFormChange}
                    placeholder="Kathmandu"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    Address Line *
                  </label>
                  <input
                    name="addressLine"
                    value={form.addressLine}
                    onChange={handleFormChange}
                    placeholder="House no, ward, area"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    Street (optional)
                  </label>
                  <input
                    name="street"
                    value={form.street}
                    onChange={handleFormChange}
                    placeholder="Street"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-[12px] text-[#8b90ad]">
                    Postal Code (optional)
                  </label>
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleFormChange}
                    placeholder="44600"
                    className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white"
                  />
                </div>

                <label className="md:col-span-2 mt-2 flex items-center gap-3 text-sm text-[#cbd5ff]">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={form.isDefault}
                    onChange={handleFormChange}
                  />
                  Set as default
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                  className="rounded-full border border-[#2b2f45] bg-transparent px-6 py-3 text-sm text-white hover:bg-white/10"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#2f7efc] px-6 py-3 text-sm hover:brightness-105 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
