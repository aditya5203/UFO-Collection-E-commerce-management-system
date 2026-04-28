// client/app/address/page.tsx
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

type AddressType = "Shipping" | "Billing";
type AddressLabel = "Home" | "Work" | "Other";
type ToastType = "success" | "error" | "info";

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
  "h-12 w-full rounded-full border border-[#2b3042] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff] disabled:cursor-not-allowed disabled:opacity-60";

const noStoreHeaders = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
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
    <div className="fixed right-4 top-24 z-[10000] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
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

export default function AddressPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [shipping, setShipping] = React.useState<Address[]>([]);
  const [billing, setBilling] = React.useState<Address[]>([]);
  const [error, setError] = React.useState("");

  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [defaultingId, setDefaultingId] = React.useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = React.useState<Address | null>(null);

  const [editing, setEditing] = React.useState<Address | null>(null);
  const [form, setForm] = React.useState<FormState>(initialForm("Shipping"));
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});

  const [search, setSearch] = React.useState("");

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);

  const [mapCenter, setMapCenter] = React.useState<LatLng>(defaultCenter);
  const [markerPosition, setMarkerPosition] =
    React.useState<LatLng>(defaultCenter);
  const [mapLoaded, setMapLoaded] = React.useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteTarget) setDeleteTarget(null);
        if (modalOpen) resetModalState();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, deleteTarget]);

  React.useEffect(() => {
    if (!modalOpen && !deleteTarget) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen, deleteTarget]);

  const districtsForProvince: District[] = React.useMemo(() => {
    return NEPAL_DISTRICTS.filter((d) => d.provinceId === form.provinceId);
  }, [form.provinceId]);

  const totalAddresses = shipping.length + billing.length;

  const defaultShipping = React.useMemo(
    () => shipping.find((a) => a.isDefault) || null,
    [shipping]
  );

  const filterAddresses = React.useCallback(
    (list: Address[]) => {
      const q = search.trim().toLowerCase();
      if (!q) return list;

      return list.filter((a) => {
        const haystack = `${fullName(a)} ${a.phone || ""} ${a.email || ""} ${line2(
          a
        )} ${a.label || ""} ${a.type || ""}`.toLowerCase();

        return haystack.includes(q);
      });
    },
    [search]
  );

  const filteredShipping = React.useMemo(
    () => filterAddresses(shipping),
    [shipping, filterAddresses]
  );

  const filteredBilling = React.useMemo(
    () => filterAddresses(billing),
    [billing, filterAddresses]
  );

  const loadAddresses = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/addresses`, {
        credentials: "include",
        cache: "no-store",
        headers: noStoreHeaders,
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

    if (!form.addressLine.trim()) {
      next.addressLine = "Address line is required";
    }

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
    setForm((prev) => ({ ...prev, lat, lng }));
    setFormErrors((prev) => ({ ...prev, general: "" }));
    showToast("Map location updated.", "info");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormErrors((prev) => ({
        ...prev,
        general: "Geolocation is not supported in this browser",
      }));
      showToast("Geolocation is not supported in this browser.", "error");
      return;
    }

    showToast("Fetching your current location...", "info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        setForm((prev) => ({ ...prev, lat, lng }));
        setFormErrors((prev) => ({ ...prev, general: "" }));
        showToast("Current location selected.", "success");
      },
      () => {
        setFormErrors((prev) => ({
          ...prev,
          general: "Unable to fetch your current location",
        }));
        showToast("Unable to fetch your current location.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast("Please fix the highlighted fields.", "error");
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
        lat: form.lat,
        lng: form.lng,
      };

      const url = editing
        ? `${API}/addresses/${editing.id}`
        : `${API}/addresses`;

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...noStoreHeaders,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok || !json?.success) {
        const msg =
          json?.message ||
          (editing ? "Failed to update address" : "Failed to create address");

        setFormErrors((prev) => ({
          ...prev,
          general: msg,
        }));

        showToast(msg, "error");
        return;
      }

      resetModalState();
      await loadAddresses();
      showToast(
        editing ? "Address updated successfully." : "Address added successfully.",
        "success"
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAddress = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      const res = await fetch(`${API}/addresses/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: noStoreHeaders,
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok || !json?.success) {
        showToast(json?.message || "Failed to delete address.", "error");
        return;
      }

      setDeleteTarget(null);
      await loadAddresses();
      showToast("Address deleted successfully.", "success");
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
        cache: "no-store",
        headers: noStoreHeaders,
      });

      const json = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok || !json?.success) {
        showToast(json?.message || "Failed to set default address.", "error");
        return;
      }

      await loadAddresses();
      showToast("Default address updated.", "success");
    } finally {
      setDefaultingId(null);
    }
  };

  const copyText = async (text: string, successMessage: string) => {
    const clean = String(text || "").trim();

    if (!clean) {
      showToast("Nothing to copy.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(clean);
      showToast(successMessage, "success");
    } catch {
      showToast("Unable to copy.", "error");
    }
  };

  const AddressCard = ({ a }: { a: Address }) => {
    const hasCoords =
      typeof a.lat === "number" &&
      Number.isFinite(a.lat) &&
      typeof a.lng === "number" &&
      Number.isFinite(a.lng);

    return (
      <div className="group rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-1 hover:border-[#4a506b] hover:shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[18px] font-semibold text-white">
                {fullName(a)}
              </h3>

              {a.isDefault ? (
                <span className="rounded-full border border-[#d6c7ff]/30 bg-[#d6c7ff]/10 px-3 py-1 text-[11px] font-semibold text-[#d6c7ff]">
                  Default
                </span>
              ) : null}

              {a.label ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#a7aec4]">
                  {a.label}
                </span>
              ) : null}

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                {a.type}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                    Delivery Address
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(line2(a), "Address copied successfully.")
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white transition hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>

                <p className="mt-2 text-[14px] leading-6 text-[#d6dbeb]">
                  {line2(a) || "-"}
                </p>

                <p className="mt-1 text-[13px] text-[#a7aec4]">
                  {a.country || "Nepal"}
                </p>
              </div>

              <div className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                    Contact
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyText(a.phone || "", "Phone number copied.")
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white transition hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>

                <p className="mt-2 text-[14px] text-white">{a.phone || "-"}</p>

                <p className="mt-1 truncate text-[13px] text-[#a7aec4]">
                  {a.email || "No email added"}
                </p>

                {a.updatedAt ? (
                  <p className="mt-2 text-[12px] text-[#7f879f]">
                    Updated {formatUpdatedAt(a.updatedAt)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] text-[#a7aec4]">
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
                className="inline-flex h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {defaultingId === a.id ? "Setting..." : "Set Default"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => openEdit(a)}
              className="inline-flex h-[44px] items-center justify-center rounded-full border border-[#d6c7ff]/25 bg-[#d6c7ff]/10 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#d6c7ff] transition hover:bg-[#d6c7ff]/15"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => setDeleteTarget(a)}
              disabled={deletingId === a.id}
              className="inline-flex h-[44px] items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="mb-2 block text-[13px] font-medium text-[#d6dbeb]"
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
    <>
      <CartHeader />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-6 text-[13px] text-[#a7aec4]">
            <Link href="/profile" className="transition hover:text-white">
              Profile
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Address Book</span>
          </div>

          {loading ? (
            <div className="grid gap-6">
              {[1, 2].map((n) => (
                <div key={n} className={`${panelClass} p-6`}>
                  <div className="h-5 w-40 animate-pulse rounded bg-white/5" />
                  <div className="mt-6 h-28 animate-pulse rounded-[20px] bg-white/5" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {error ? (
                <div className="mb-6 rounded-[20px] border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 text-sm text-yellow-200">
                  {error}
                </div>
              ) : null}

              <section className={`${panelClass} overflow-hidden p-6 sm:p-8`}>
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                      Saved delivery addresses
                    </div>

                    <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                      Address Book
                    </h1>

                    <p className="mt-3 max-w-[720px] text-[14px] leading-7 text-[#a7aec4] sm:text-[15px]">
                      Manage your shipping and billing addresses with accurate
                      map pin selection for smoother checkout.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openAdd("Shipping")}
                        className={primaryBtnClass}
                      >
                        Add Shipping Address
                      </button>

                      <button
                        type="button"
                        onClick={() => openAdd("Billing")}
                        className={secondaryBtnClass}
                      >
                        Add Billing Address
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                    {[
                      ["Total", totalAddresses],
                      ["Shipping", shipping.length],
                      ["Billing", billing.length],
                      [
                        "Default",
                        defaultShipping ? defaultShipping.label || "Shipping" : "—",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-[20px] border border-[#26293a] bg-[#161824] p-4"
                      >
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                          {label}
                        </div>

                        <div className="mt-2 truncate text-[24px] font-semibold text-white">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className={`${panelClass} mt-8 p-4 sm:p-5`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[20px] font-semibold tracking-[-0.02em] text-white">
                      Search Addresses
                    </div>
                    <div className="mt-1 text-[13px] text-[#a7aec4]">
                      Search by name, phone, email, city, district, or label.
                    </div>
                  </div>

                  {search.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        showToast("Search cleared.", "info");
                      }}
                      className={secondaryBtnClass}
                    >
                      Clear Search
                    </button>
                  ) : null}
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search saved addresses..."
                  className={`${inputClass} mt-5`}
                  aria-label="Search saved addresses"
                />
              </section>

              <div className="mt-8 grid gap-8">
                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[22px] font-semibold text-white">
                        Shipping Addresses
                      </h2>

                      <p className="mt-1 text-[14px] text-[#a7aec4]">
                        Select where your orders should be delivered.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openAdd("Shipping")}
                      className={primaryBtnClass}
                    >
                      Add Shipping
                    </button>
                  </div>

                  {filteredShipping.length ? (
                    <div className="grid gap-4">
                      {filteredShipping.map((a) => (
                        <AddressCard key={a.id} a={a} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[#26293a] bg-[#161824] px-6 py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-white/5 text-2xl">
                        📍
                      </div>

                      <h3 className="mt-4 text-[18px] font-semibold text-white">
                        {search.trim()
                          ? "No matching shipping address"
                          : "No shipping addresses yet"}
                      </h3>

                      <p className="mx-auto mt-2 max-w-[480px] text-[14px] leading-6 text-[#a7aec4]">
                        {search.trim()
                          ? "Try changing your search keyword."
                          : "Add your delivery address with province, district, and an exact map pin for smoother checkout."}
                      </p>

                      {!search.trim() ? (
                        <button
                          type="button"
                          onClick={() => openAdd("Shipping")}
                          className={`${primaryBtnClass} mt-5`}
                        >
                          Add First Address
                        </button>
                      ) : null}
                    </div>
                  )}
                </section>

                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[22px] font-semibold text-white">
                        Billing Addresses
                      </h2>

                      <p className="mt-1 text-[14px] text-[#a7aec4]">
                        Optional billing details for invoices and payment records.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openAdd("Billing")}
                      className={secondaryBtnClass}
                    >
                      Add Billing
                    </button>
                  </div>

                  {filteredBilling.length ? (
                    <div className="grid gap-4">
                      {filteredBilling.map((a) => (
                        <AddressCard key={a.id} a={a} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[#26293a] bg-[#161824] px-6 py-10 text-center text-[14px] text-[#a7aec4]">
                      {search.trim()
                        ? "No matching billing address."
                        : "No billing addresses yet."}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>

      {modalOpen ? (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-[4px]">
          <div className="flex h-full items-start justify-center overflow-y-auto p-4 sm:p-6">
            <div className="my-6 w-full max-w-[1120px] overflow-hidden rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#26293a] px-5 py-4 sm:px-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[#a7aec4]">
                    {editing ? "Update saved address" : "Create new address"}
                  </div>

                  <div className="mt-1 text-[22px] font-semibold text-white">
                    {editing ? "Edit Address" : "Add Address"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetModalState}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAddress}>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
                  <div className="border-b border-[#26293a] p-5 sm:p-6 lg:border-b-0 lg:border-r">
                    {formErrors.general ? (
                      <div className="mb-5 rounded-[18px] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {formErrors.general}
                      </div>
                    ) : null}

                    {loadError ? (
                      <div className="mb-5 rounded-[18px] border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                        Google Maps failed to load. Check your API key and
                        allowed referrers.
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
                          className="mt-1 flex items-start gap-3 rounded-[20px] border border-[#26293a] bg-[#161824] px-4 py-4 text-sm text-[#d6dbeb]"
                        >
                          <input
                            id="isDefault"
                            type="checkbox"
                            name="isDefault"
                            checked={form.isDefault}
                            onChange={handleFormChange}
                            className="mt-1 h-4 w-4 rounded border border-white/20 bg-transparent accent-white"
                            aria-label="Set as default address"
                          />

                          <span>
                            <span className="block font-medium text-white">
                              Set as default address
                            </span>

                            <span className="mt-1 block text-[13px] leading-6 text-[#a7aec4]">
                              This address will be preferred during checkout.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="rounded-[24px] border border-[#26293a] bg-[#161824] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[18px] font-semibold text-white">
                            Delivery location picker
                          </h3>

                          <p className="mt-1 text-[13px] leading-6 text-[#a7aec4]">
                            Use current location or drag the marker to the exact
                            delivery point.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="inline-flex h-[40px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
                          aria-label="Use current location"
                        >
                          Use Location
                        </button>
                      </div>

                      {isLoaded ? (
                        <>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
                              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                                Latitude
                              </div>

                              <div className="mt-2 text-[15px] font-semibold text-white">
                                {form.lat.toFixed(6)}
                              </div>
                            </div>

                            <div className="rounded-[18px] border border-[#26293a] bg-[#0d0f17] p-4">
                              <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                                Longitude
                              </div>

                              <div className="mt-2 text-[15px] font-semibold text-white">
                                {form.lng.toFixed(6)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-[20px] border border-[#26293a]">
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
                        <div className="mt-4 rounded-[18px] border border-[#26293a] bg-[#0d0f17] px-4 py-8 text-center text-[14px] text-[#a7aec4]">
                          Loading Google Maps...
                        </div>
                      )}

                      <div className="mt-4 rounded-[18px] border border-[#d6c7ff]/20 bg-[#d6c7ff]/10 px-4 py-3 text-[12px] leading-6 text-[#d6c7ff]">
                        {mapLoaded
                          ? "Tip: drag the pin to set the exact delivery location. Latitude and longitude update automatically."
                          : "Map is loading..."}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[24px] border border-[#26293a] bg-[#161824] p-4">
                      <div className="text-[12px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        Preview
                      </div>

                      <div className="mt-3 space-y-2 text-[14px] text-[#d6dbeb]">
                        <p className="font-semibold text-white">
                          {`${form.firstName} ${form.lastName}`.trim() ||
                            "Full name"}
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

                <div className="flex flex-col gap-3 border-t border-[#26293a] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={resetModalState}
                    className={secondaryBtnClass}
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryBtnClass}
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

      {deleteTarget ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[4px]">
          <div className="w-full max-w-[440px] rounded-[26px] border border-[#26293a] bg-[#11121a] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-red-300">
              Delete address
            </div>

            <h3 className="mt-2 text-[24px] font-semibold text-white">
              Are you sure?
            </h3>

            <p className="mt-3 text-[14px] leading-7 text-[#a7aec4]">
              This will permanently delete the address for{" "}
              <span className="font-semibold text-white">
                {fullName(deleteTarget)}
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-5 rounded-[18px] border border-[#26293a] bg-[#161824] p-4 text-[13px] leading-6 text-[#d6dbeb]">
              {line2(deleteTarget)}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className={secondaryBtnClass}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteAddress}
                disabled={deletingId === deleteTarget.id}
                className="inline-flex items-center justify-center rounded-full border border-red-500/25 bg-red-500/15 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MainFooter />
    </>
  );
}