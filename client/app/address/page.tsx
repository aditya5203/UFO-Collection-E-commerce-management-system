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

type AddressType = "Shipping" | "Billing";
type AddressLabel = "Home" | "Work" | "Other";

type LatLng = {
  lat: number;
  lng: number;
};

type Address = {
  id: string;
  userId?: string;

  type: AddressType;
  label?: AddressLabel;

  email?: string;
  firstName: string;
  lastName: string;

  country?: string;
  provinceId: string;
  district: string;
  cityOrMunicipality: string;

  addressLine: string;
  street?: string;
  postalCode?: string;
  phone: string;

  isDefault?: boolean;

  lat?: number;
  lng?: number;

  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
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

  lat: number;
  lng: number;
};

type FormErrors = Partial<Record<keyof FormState, string>> & {
  general?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
const API = `${API_BASE}/api`;

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const defaultCenter: LatLng = {
  lat: 27.7172,
  lng: 85.324,
};

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

function formatUpdatedAt(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initialForm(type: AddressType = "Shipping"): FormState {
  return {
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

    isDefault: type === "Shipping",

    lat: defaultCenter.lat,
    lng: defaultCenter.lng,
  };
}

const inputClass =
  "h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition placeholder:text-[#7f88b3] focus:border-[#2f7efc]/80 focus:bg-white/[0.05] focus:ring-4 focus:ring-[#2f7efc]/15 disabled:cursor-not-allowed disabled:opacity-60";

export default function AddressPage() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [shipping, setShipping] = React.useState<Address[]>([]);
  const [billing, setBilling] = React.useState<Address[]>([]);
  const [error, setError] = React.useState("");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [defaultingId, setDefaultingId] = React.useState<string | null>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const [editing, setEditing] = React.useState<Address | null>(null);
  const [form, setForm] = React.useState<FormState>(initialForm("Shipping"));
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});

  const [mapCenter, setMapCenter] = React.useState<LatLng>(defaultCenter);
  const [markerPosition, setMarkerPosition] =
    React.useState<LatLng>(defaultCenter);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const modalCardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        if (modalOpen) {
          setModalOpen(false);
          setEditing(null);
          setFormErrors({});
        }
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, modalOpen]);

  React.useEffect(() => {
    if (!modalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen]);

  const districtsForProvince: District[] = React.useMemo(() => {
    return NEPAL_DISTRICTS.filter((d) => d.provinceId === form.provinceId);
  }, [form.provinceId]);

  const totalAddresses = shipping.length + billing.length;
  const defaultShipping = React.useMemo(
    () => shipping.find((a) => a.isDefault) || null,
    [shipping]
  );

  const loadAddresses = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/addresses`, {
        credentials: "include",
      });

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

        lat:
          typeof x?.lat === "number" && Number.isFinite(x.lat)
            ? x.lat
            : undefined,
        lng:
          typeof x?.lng === "number" && Number.isFinite(x.lng)
            ? x.lng
            : undefined,

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

  const resetModalState = React.useCallback(() => {
    setModalOpen(false);
    setEditing(null);
    setSaving(false);
    setFormErrors({});
    setMapLoaded(false);
    setForm(initialForm("Shipping"));
    setMapCenter(defaultCenter);
    setMarkerPosition(defaultCenter);
  }, []);

  const openAdd = (type: AddressType) => {
    setEditing(null);
    setForm(initialForm(type));
    setFormErrors({});
    setMapCenter(defaultCenter);
    setMarkerPosition(defaultCenter);
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    const lat =
      typeof addr.lat === "number" && Number.isFinite(addr.lat)
        ? addr.lat
        : defaultCenter.lat;
    const lng =
      typeof addr.lng === "number" && Number.isFinite(addr.lng)
        ? addr.lng
        : defaultCenter.lng;

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

      lat,
      lng,
    });
    setFormErrors({});
    setMapCenter({ lat, lng });
    setMarkerPosition({ lat, lng });
    setModalOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: "", general: "" }));
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setField(name as keyof FormState, checked as never);
      return;
    }

    if (name === "provinceId") {
      setForm((prev) => ({
        ...prev,
        provinceId: value,
        district: "",
        cityOrMunicipality: "",
      }));
      setFormErrors((prev) => ({
        ...prev,
        provinceId: "",
        district: "",
        cityOrMunicipality: "",
        general: "",
      }));
      return;
    }

    setField(name as keyof FormState, value as never);
  };

  const validateForm = (): FormErrors => {
    const next: FormErrors = {};

    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";

    if (!form.phone.trim()) {
      next.phone = "Phone is required";
    } else if (!/^(97|98)\d{8}$/.test(form.phone.trim())) {
      next.phone = "Enter a valid Nepali mobile number";
    }

    if (form.email.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!ok) next.email = "Enter a valid email address";
    }

    if (!form.provinceId.trim()) next.provinceId = "Province is required";
    if (!form.district.trim()) next.district = "District is required";
    if (!form.cityOrMunicipality.trim()) {
      next.cityOrMunicipality = "City/Municipality is required";
    }
    if (!form.addressLine.trim()) next.addressLine = "Address line is required";

    if (
      typeof form.lat !== "number" ||
      !Number.isFinite(form.lat) ||
      typeof form.lng !== "number" ||
      !Number.isFinite(form.lng)
    ) {
      next.general = "Please select a valid map location";
    }

    return next;
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();

    if (typeof lat !== "number" || typeof lng !== "number") return;

    setMarkerPosition({ lat, lng });
    setMapCenter({ lat, lng });
    setForm((prev) => ({
      ...prev,
      lat,
      lng,
    }));
    setFormErrors((prev) => ({ ...prev, general: "" }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormErrors((prev) => ({
        ...prev,
        general: "Geolocation is not supported in this browser",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        setForm((prev) => ({ ...prev, lat, lng }));
        setFormErrors((prev) => ({ ...prev, general: "" }));
      },
      () => {
        setFormErrors((prev) => ({
          ...prev,
          general: "Unable to fetch your current location",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

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

        lat: form.lat,
        lng: form.lng,
      };

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
          setFormErrors((prev) => ({
            ...prev,
            general: json?.message || "Failed to create address",
          }));
          return;
        }

        resetModalState();
        await loadAddresses();
        return;
      }

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
        setFormErrors((prev) => ({
          ...prev,
          general: json?.message || "Failed to update address",
        }));
        return;
      }

      resetModalState();
      await loadAddresses();
    } finally {
      setSaving(false);
    }
  };

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

  const AddressCard = ({ a }: { a: Address }) => {
    const hasCoords =
      typeof a.lat === "number" &&
      Number.isFinite(a.lat) &&
      typeof a.lng === "number" &&
      Number.isFinite(a.lng);

    return (
      <div className="group rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,35,0.98),rgba(10,12,24,0.98))] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.28)] transition hover:border-[#2f7efc]/40 hover:shadow-[0_18px_60px_rgba(47,126,252,0.16)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[18px] font-semibold text-white">
                {fullName(a)}
              </h3>

              {a.isDefault ? (
                <span className="rounded-full border border-[#2f7efc]/30 bg-[#2f7efc]/12 px-3 py-1 text-[11px] font-semibold text-[#bcd4ff]">
                  Default
                </span>
              ) : null}

              {a.label ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#aeb8dc]">
                  {a.label}
                </span>
              ) : null}

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                {a.type}
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#7f88b3]">
                  Delivery Address
                </div>
                <p className="mt-2 text-[14px] leading-6 text-[#d9def7]">
                  {line2(a) || "-"}
                </p>
                <p className="mt-1 text-[13px] text-[#9aa3cc]">
                  {a.country || "Nepal"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#7f88b3]">
                  Contact
                </div>
                <p className="mt-2 text-[14px] text-white">{a.phone || "-"}</p>
                <p className="mt-1 truncate text-[13px] text-[#9aa3cc]">
                  {a.email || "No email added"}
                </p>
                {a.updatedAt ? (
                  <p className="mt-2 text-[12px] text-[#7f88b3]">
                    Updated {formatUpdatedAt(a.updatedAt)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[#9aa3cc]">
              {hasCoords ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {a.lat?.toFixed(5)}, {a.lng?.toFixed(5)}
                </span>
              ) : (
                <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-yellow-200">
                  No map pin saved
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-row flex-wrap gap-2 lg:w-[176px] lg:flex-col">
            {!a.isDefault ? (
              <button
                type="button"
                onClick={() => setDefault(a.id)}
                disabled={defaultingId === a.id}
                className="inline-flex h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {defaultingId === a.id ? "Setting..." : "Set Default"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => openEdit(a)}
              className="inline-flex h-[44px] items-center justify-center rounded-xl border border-[#2f7efc]/30 bg-[#2f7efc]/12 px-4 text-[13px] font-semibold text-[#d7e6ff] transition hover:bg-[#2f7efc]/18"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => deleteAddress(a.id)}
              disabled={deletingId === a.id}
              className="inline-flex h-[44px] items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-[13px] font-semibold text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingId === a.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Field = ({
    label,
    errorText,
    required,
    htmlFor,
    children,
  }: {
    label: string;
    errorText?: string;
    required?: boolean;
    htmlFor?: string;
    children: React.ReactNode;
  }) => {
    return (
      <div>
        <label
          htmlFor={htmlFor}
          className="mb-2 block text-[13px] font-medium text-[#cfd3ff]"
        >
          {label} {required ? <span className="text-red-300">*</span> : null}
        </label>
        {children}
        {errorText ? (
          <p className="mt-2 text-[12px] text-red-300">{errorText}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050611] text-white">
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[8px] text-[11px] uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-[#050611]"
              aria-label="Go back"
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

            <Link href="/homepage" className="flex min-w-0 items-center gap-3">
              <div className="h-[44px] w-[44px] overflow-hidden rounded-full border-2 border-white sm:h-[48px] sm:w-[48px]">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="truncate text-[18px] font-bold uppercase tracking-[0.16em] text-white sm:text-[24px]">
                UFO Collection
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/homepage"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              Home
            </Link>
            <Link
              href="/collection"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              Collection
            </Link>
            <Link
              href="/about"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[14px] uppercase tracking-[0.16em] text-[#8b90ad] transition hover:text-[#c9b9ff]"
            >
              Contact
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
              className="rounded-full border border-[#2b2f45] p-2 transition hover:bg-white/10"
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
              className="rounded-full border border-[#2b2f45] p-2 transition hover:bg-white/10"
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
              <div className="absolute right-0 top-[56px] z-50 w-[220px] overflow-hidden rounded-[14px] border border-[#23253a] bg-[#101223] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <Link
                  href="/order-tracking"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white transition hover:bg-[#15182a]"
                >
                  Order Tracking
                </Link>

                <Link
                  href="/order-history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white transition hover:bg-[#15182a]"
                >
                  Order History
                </Link>

                <Link
                  href="/address"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white transition hover:bg-[#15182a]"
                >
                  Address
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/language");
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] text-white transition hover:bg-[#15182a]"
                  aria-label="Language"
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
                  className="w-full px-4 py-3 text-left text-[13px] text-red-300 transition hover:bg-[#15182a] disabled:opacity-60"
                  aria-label="Logout"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 text-[13px] text-[#8f98c2]">
          <Link href="/profile" className="transition hover:text-white">
            Profile
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">Address Book</span>
        </div>

        {loading ? (
          <div className="grid gap-6">
            <div className="rounded-[28px] border border-white/10 bg-[#101223] p-6">
              <div className="h-5 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-6 h-28 animate-pulse rounded-2xl bg-white/5" />
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[#101223] p-6">
              <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
              <div className="mt-6 h-28 animate-pulse rounded-2xl bg-white/5" />
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 text-sm text-yellow-200">
                {error}
              </div>
            ) : null}

            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(47,126,252,0.16),transparent_36%),linear-gradient(180deg,rgba(16,18,35,0.98),rgba(8,10,20,0.98))] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.35)] sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div>
                  <div className="inline-flex rounded-full border border-[#2f7efc]/25 bg-[#2f7efc]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#bcd4ff]">
                    Saved delivery addresses
                  </div>

                  <h1 className="mt-4 text-[34px] font-extrabold tracking-tight text-white sm:text-[46px]">
                    Address Book
                  </h1>

                  <p className="mt-3 max-w-[720px] text-[15px] leading-7 text-[#b5bfdc]">
                    Manage your saved addresses with cleaner forms, faster entry,
                    and accurate map pin selection for delivery.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openAdd("Shipping")}
                      className="inline-flex h-[48px] items-center justify-center rounded-2xl bg-[#2f7efc] px-5 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(47,126,252,0.35)] transition hover:-translate-y-[1px] hover:brightness-110"
                      aria-label="Add shipping address"
                    >
                      Add Shipping Address
                    </button>

                    <button
                      type="button"
                      onClick={() => openAdd("Billing")}
                      className="inline-flex h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-[14px] font-semibold text-white transition hover:bg-white/10"
                      aria-label="Add billing address"
                    >
                      Add Billing Address
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      Total
                    </div>
                    <div className="mt-2 text-[28px] font-bold text-white">
                      {totalAddresses}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      Shipping
                    </div>
                    <div className="mt-2 text-[28px] font-bold text-white">
                      {shipping.length}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      Billing
                    </div>
                    <div className="mt-2 text-[28px] font-bold text-white">
                      {billing.length}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                      Default
                    </div>
                    <div className="mt-2 truncate text-[15px] font-semibold text-white">
                      {defaultShipping ? defaultShipping.label || "Shipping" : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 grid gap-8">
              <section className="rounded-[28px] border border-white/10 bg-[#101223] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.22)] sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-white">
                      Shipping Addresses
                    </h2>
                    <p className="mt-1 text-[14px] text-[#9aa3cc]">
                      Select where your orders should be delivered.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAdd("Shipping")}
                    className="inline-flex h-[44px] items-center justify-center rounded-xl bg-[#2f7efc] px-4 text-[13px] font-semibold text-white transition hover:brightness-110"
                    aria-label="Add shipping"
                  >
                    Add Shipping
                  </button>
                </div>

                {shipping.length ? (
                  <div className="grid gap-4">
                    {shipping.map((a) => (
                      <AddressCard key={a.id} a={a} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                      📍
                    </div>
                    <h3 className="mt-4 text-[18px] font-semibold text-white">
                      No shipping addresses yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-[480px] text-[14px] leading-6 text-[#9aa3cc]">
                      Add your delivery address with province, district, and an
                      exact map pin for smoother checkout.
                    </p>
                    <button
                      type="button"
                      onClick={() => openAdd("Shipping")}
                      className="mt-5 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#2f7efc] px-4 text-[13px] font-semibold text-white transition hover:brightness-110"
                      aria-label="Add first shipping address"
                    >
                      Add First Address
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-white/10 bg-[#101223] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.22)] sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-white">
                      Billing Addresses
                    </h2>
                    <p className="mt-1 text-[14px] text-[#9aa3cc]">
                      Optional billing details for invoices and payment records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openAdd("Billing")}
                    className="inline-flex h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-semibold text-white transition hover:bg-white/10"
                    aria-label="Add billing"
                  >
                    Add Billing
                  </button>
                </div>

                {billing.length ? (
                  <div className="grid gap-4">
                    {billing.map((a) => (
                      <AddressCard key={a.id} a={a} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center text-[14px] text-[#9aa3cc]">
                    No billing addresses yet.
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-[4px]">
          <div className="flex h-full items-start justify-center overflow-y-auto p-4 sm:p-6">
            <div
              ref={modalCardRef}
              className="my-6 w-full max-w-[1120px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0d1120] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#7f88b3]">
                    {editing ? "Update saved address" : "Create new address"}
                  </div>
                  <div className="mt-1 text-[20px] font-bold text-white">
                    {editing ? "Edit Address" : "Add Address"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetModalState}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#cfd3ff] transition hover:bg-white/10"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAddress}>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                    {formErrors.general ? (
                      <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {formErrors.general}
                      </div>
                    ) : null}

                    {loadError ? (
                      <div className="mb-5 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                        Google Maps failed to load. Check your API key and allowed
                        referrers.
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Type" required htmlFor="type">
                        <select
                          id="type"
                          name="type"
                          value={form.type}
                          onChange={handleFormChange}
                          className={inputClass}
                          aria-label="Type"
                        >
                          <option value="Shipping">Shipping</option>
                          <option value="Billing">Billing</option>
                        </select>
                      </Field>

                      <Field label="Label" required htmlFor="label">
                        <select
                          id="label"
                          name="label"
                          value={form.label}
                          onChange={handleFormChange}
                          className={inputClass}
                          aria-label="Label"
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </Field>

                      <div className="md:col-span-2">
                        <Field
                          label="Email"
                          errorText={formErrors.email}
                          htmlFor="email"
                        >
                          <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleFormChange}
                            placeholder="email@example.com"
                            className={inputClass}
                            autoComplete="email"
                            aria-label="Email"
                          />
                        </Field>
                      </div>

                      <Field
                        label="First Name"
                        required
                        errorText={formErrors.firstName}
                        htmlFor="firstName"
                      >
                        <input
                          id="firstName"
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleFormChange}
                          placeholder="First name"
                          className={inputClass}
                          autoComplete="given-name"
                          aria-label="First Name"
                        />
                      </Field>

                      <Field
                        label="Last Name"
                        required
                        errorText={formErrors.lastName}
                        htmlFor="lastName"
                      >
                        <input
                          id="lastName"
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleFormChange}
                          placeholder="Last name"
                          className={inputClass}
                          autoComplete="family-name"
                          aria-label="Last Name"
                        />
                      </Field>

                      <Field
                        label="Phone"
                        required
                        errorText={formErrors.phone}
                        htmlFor="phone"
                      >
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleFormChange}
                          placeholder="98xxxxxxxx"
                          className={inputClass}
                          inputMode="numeric"
                          autoComplete="tel"
                          aria-label="Phone"
                        />
                      </Field>

                      <Field label="Country" htmlFor="country">
                        <input
                          id="country"
                          type="text"
                          name="country"
                          value={form.country}
                          onChange={handleFormChange}
                          className={`${inputClass} opacity-80`}
                          autoComplete="country-name"
                          aria-label="Country"
                        />
                      </Field>

                      <Field
                        label="Province"
                        required
                        errorText={formErrors.provinceId}
                        htmlFor="provinceId"
                      >
                        <select
                          id="provinceId"
                          name="provinceId"
                          value={form.provinceId}
                          onChange={handleFormChange}
                          className={inputClass}
                          aria-label="Province"
                        >
                          <option value="">Select Province</option>
                          {NEPAL_PROVINCES.map((p: Province) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        label="District"
                        required
                        errorText={formErrors.district}
                        htmlFor="district"
                      >
                        <select
                          id="district"
                          name="district"
                          value={form.district}
                          onChange={handleFormChange}
                          disabled={!form.provinceId}
                          className={inputClass}
                          aria-label="District"
                        >
                          <option value="">
                            {form.provinceId
                              ? "Select District"
                              : "Select Province first"}
                          </option>
                          {districtsForProvince.map((d: District) => (
                            <option key={d.name} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field
                        label="City / Municipality"
                        required
                        errorText={formErrors.cityOrMunicipality}
                        htmlFor="cityOrMunicipality"
                      >
                        <input
                          id="cityOrMunicipality"
                          type="text"
                          name="cityOrMunicipality"
                          value={form.cityOrMunicipality}
                          onChange={handleFormChange}
                          placeholder="City / Municipality"
                          disabled={!form.district}
                          className={inputClass}
                          autoComplete="address-level2"
                          aria-label="City / Municipality"
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field
                          label="Address Line"
                          required
                          errorText={formErrors.addressLine}
                          htmlFor="addressLine"
                        >
                          <input
                            id="addressLine"
                            type="text"
                            name="addressLine"
                            value={form.addressLine}
                            onChange={handleFormChange}
                            placeholder="House no, ward, landmark, area"
                            className={inputClass}
                            autoComplete="address-line1"
                            aria-label="Address Line"
                          />
                        </Field>
                      </div>

                      <Field label="Street" htmlFor="street">
                        <input
                          id="street"
                          type="text"
                          name="street"
                          value={form.street}
                          onChange={handleFormChange}
                          placeholder="Street"
                          className={inputClass}
                          autoComplete="address-line2"
                          aria-label="Street"
                        />
                      </Field>

                      <Field label="Postal Code" htmlFor="postalCode">
                        <input
                          id="postalCode"
                          type="text"
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleFormChange}
                          placeholder="44600"
                          className={inputClass}
                          autoComplete="postal-code"
                          aria-label="Postal Code"
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="isDefault"
                          className="mt-1 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-[#dbe2ff]"
                        >
                          <input
                            id="isDefault"
                            type="checkbox"
                            name="isDefault"
                            checked={form.isDefault}
                            onChange={handleFormChange}
                            className="mt-1 h-4 w-4 rounded border border-white/20 bg-transparent"
                            aria-label="Set as default address"
                          />
                          <span>
                            <span className="block font-medium text-white">
                              Set as default address
                            </span>
                            <span className="mt-1 block text-[13px] leading-6 text-[#9aa3cc]">
                              This address will be preferred during checkout.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[17px] font-semibold text-white">
                            Delivery location picker
                          </h3>
                          <p className="mt-1 text-[13px] leading-6 text-[#9aa3cc]">
                            Use current location or drag the marker to the exact
                            delivery point.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="inline-flex h-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[12px] font-semibold text-white transition hover:bg-white/10"
                          aria-label="Use current location"
                        >
                          Use current location
                        </button>
                      </div>

                      {isLoaded ? (
                        <>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                                Latitude
                              </div>
                              <div className="mt-2 text-[15px] font-semibold text-white">
                                {form.lat.toFixed(6)}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <div className="text-[11px] uppercase tracking-[0.16em] text-[#7f88b3]">
                                Longitude
                              </div>
                              <div className="mt-2 text-[15px] font-semibold text-white">
                                {form.lng.toFixed(6)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
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
                                zoomControl: true,
                              }}
                            >
                              <Marker
                                position={markerPosition}
                                draggable
                                onDragEnd={handleMarkerDragEnd}
                              />
                            </GoogleMap>
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-[14px] text-[#9aa3cc]">
                          Loading Google Maps...
                        </div>
                      )}

                      <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-[12px] leading-6 text-[#d5e4ff]">
                        {mapLoaded
                          ? "Tip: drag the pin to set the exact pickup location. Latitude and longitude update automatically."
                          : "Map is loading..."}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[12px] uppercase tracking-[0.16em] text-[#7f88b3]">
                        Preview
                      </div>
                      <div className="mt-3 space-y-2 text-[14px] text-[#d8def7]">
                        <p className="font-semibold text-white">
                          {`${form.firstName} ${form.lastName}`.trim() || "Full name"}
                        </p>
                        <p>{form.addressLine || "Address line"}</p>
                        <p>
                          {[form.cityOrMunicipality, form.district, form.provinceId]
                            .filter(Boolean)
                            .join(", ") || "City, District, Province"}
                        </p>
                        <p>{form.phone || "Phone number"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={resetModalState}
                    className="inline-flex h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-transparent px-5 text-[14px] font-semibold text-white transition hover:bg-white/5"
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-[48px] items-center justify-center rounded-2xl bg-[#2f7efc] px-6 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(47,126,252,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={editing ? "Update address" : "Save address"}
                  >
                    {saving
                      ? editing
                        ? "Updating..."
                        : "Saving..."
                      : editing
                      ? "Update Address"
                      : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}