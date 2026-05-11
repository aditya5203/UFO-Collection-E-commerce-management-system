"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useJsApiLoader } from "@react-google-maps/api";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";
import AddressModal, {
  type FormErrors,
  type FormState,
} from "./_components/AddressModal";

import AddressToast from "./_components/AddressToast";
import AddressBreadcrumb from "./_components/AddressBreadcrumb";
import AddressHero from "./_components/AddressHero";
import AddressSearch from "./_components/AddressSearch";
import AddressSection from "./_components/AddressSection";
import DeleteAddressModal from "./_components/DeleteAddressModal";

import { NEPAL_PROVINCES } from "../data/nepalLocations";

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

const noStoreHeaders = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

function provinceName(id?: string) {
  return NEPAL_PROVINCES.find((p) => p.id === id)?.name || id || "";
}

function fullName(a: Address) {
  return `${a.firstName || ""} ${a.lastName || ""}`.trim() || "-";
}

function line2(a: Address) {
  const parts = [
    a.addressLine,
    a.street,
    a.cityOrMunicipality,
    a.district,
    provinceName(a.provinceId),
  ].filter(Boolean);

  return parts.join(", ");
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
  }, [modalOpen, deleteTarget, resetModalState]);

  React.useEffect(() => {
    if (!modalOpen && !deleteTarget) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [modalOpen, deleteTarget]);

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

  const openAdd = (type: AddressType) => {
    setEditing(null);
    setForm(initialForm(type));
    setFormErrors({});
    setMapCenter(defaultCenter);
    setMarkerPosition(defaultCenter);
    setMapLoaded(false);
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
    setMapLoaded(false);
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
    } catch {
      setFormErrors((prev) => ({
        ...prev,
        general: "Network error while saving address",
      }));
      showToast("Network error while saving address.", "error");
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
    } catch {
      showToast("Network error while deleting address.", "error");
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
    } catch {
      showToast("Network error while setting default address.", "error");
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

  return (
    <>
      <CartHeader backHref="/profile" />

      <AddressToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <AddressBreadcrumb />

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

              <AddressHero
                totalAddresses={totalAddresses}
                shippingCount={shipping.length}
                billingCount={billing.length}
                defaultLabel={
                  defaultShipping ? defaultShipping.label || "Shipping" : "—"
                }
                onAdd={openAdd}
              />

              <AddressSearch
                search={search}
                setSearch={setSearch}
                onClear={() => {
                  setSearch("");
                  showToast("Search cleared.", "info");
                }}
              />

              <div className="mt-8 grid gap-8">
                <AddressSection
                  title="Shipping Addresses"
                  description="Select where your orders should be delivered."
                  type="Shipping"
                  addresses={filteredShipping}
                  search={search}
                  deletingId={deletingId}
                  defaultingId={defaultingId}
                  onAdd={() => openAdd("Shipping")}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onSetDefault={setDefault}
                  onCopy={copyText}
                />

                <AddressSection
                  title="Billing Addresses"
                  description="Optional billing details for invoices and payment records."
                  type="Billing"
                  addresses={filteredBilling}
                  search={search}
                  deletingId={deletingId}
                  defaultingId={defaultingId}
                  onAdd={() => openAdd("Billing")}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onSetDefault={setDefault}
                  onCopy={copyText}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {modalOpen ? (
        <AddressModal
          editing={editing}
          form={form}
          formErrors={formErrors}
          saving={saving}
          mapCenter={mapCenter}
          markerPosition={markerPosition}
          mapLoaded={mapLoaded}
          isLoaded={isLoaded}
          loadError={loadError}
          onClose={resetModalState}
          onSubmit={handleSaveAddress}
          onChange={handleFormChange}
          onUseCurrentLocation={handleUseCurrentLocation}
          onMarkerDragEnd={handleMarkerDragEnd}
          onMapLoad={() => setMapLoaded(true)}
        />
      ) : null}

      <DeleteAddressModal
        deleteTarget={deleteTarget}
        deletingId={deletingId}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteAddress}
      />

      <MainFooter />
    </>
  );
}