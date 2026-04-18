"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminPageGuard from "../../../../_components/AdminPageGuard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type FormState = {
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  area: string;
  isActive: boolean;
  forcePasswordChange: boolean;
};

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
      >
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-700/50 bg-slate-900/25 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500/60 focus:ring-4 focus:ring-sky-500/10";
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function EditDeliveryStaffPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const [form, setForm] = React.useState<FormState>({
    name: "",
    email: "",
    phone: "",
    vehicleType: "",
    vehicleNumber: "",
    area: "",
    isActive: true,
    forcePasswordChange: false,
  });

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/admin/delivery-staff/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = await safeJson(res);

        if (!res.ok) {
          if (mounted) {
            setError((json as any)?.message || "Failed to load rider");
          }
          return;
        }

        const item = (json as any)?.data || {};

        if (!mounted) return;

        setForm({
          name: item?.name || "",
          email: item?.email || "",
          phone: item?.phone || "",
          vehicleType: item?.vehicleType || "",
          vehicleNumber: item?.vehicleNumber || "",
          area: item?.area || "",
          isActive:
            typeof item?.isActive === "boolean"
              ? item.isActive
              : Boolean(item?.active),
          forcePasswordChange: Boolean(item?.forcePasswordChange),
        });
      } catch {
        if (mounted) {
          setError("Network error while loading rider");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) load();

    return () => {
      mounted = false;
    };
  }, [id]);

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.vehicleType.trim()) return "Vehicle type is required.";
    if (!form.area.trim()) return "Delivery area is required.";
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        vehicleType: form.vehicleType.trim(),
        vehicleNumber: form.vehicleNumber.trim(),
        area: form.area.trim(),
        isActive: form.isActive,
        forcePasswordChange: form.forcePasswordChange,
      };

      const res = await fetch(`${API_BASE}/api/admin/delivery-staff/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json as any)?.message || "Failed to update delivery rider");
        return;
      }

      setSuccess("Delivery rider updated successfully.");

      setTimeout(() => {
        router.push(`/admin/delivery/staff/${id}`);
      }, 700);
    } catch {
      setError("Failed to update delivery rider");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageGuard permission="orderUpdate">
      <div className="max-w-5xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-700/50 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_35%),linear-gradient(180deg,rgba(10,19,36,1),rgba(7,14,27,1))] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.32)] md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Admin <span className="mx-2">/</span> Delivery Staff{" "}
                <span className="mx-2">/</span> Edit
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                Edit Delivery Rider
              </h1>

              <p className="text-sm text-slate-400">
                Update rider profile, area, vehicle details, and account status.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/admin/delivery/staff/${id}`}
                className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/25 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
              >
                Back to Details
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-700/50 bg-[#0A1324] p-10 text-center text-sm text-slate-400">
            Loading rider...
          </div>
        ) : (
          <>
            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <form
              onSubmit={onSubmit}
              className="rounded-3xl border border-slate-700/50 bg-[#0A1324] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] md:p-8"
            >
              <div className="grid gap-8 md:grid-cols-2">
                <Field label="Full Name" htmlFor="delivery-name" required>
                  <input
                    id="delivery-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter rider full name"
                    className={inputClassName()}
                  />
                </Field>

                <Field label="Email" htmlFor="delivery-email" required>
                  <input
                    id="delivery-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="Enter rider email"
                    className={inputClassName()}
                  />
                </Field>

                <Field label="Phone Number" htmlFor="delivery-phone" required>
                  <input
                    id="delivery-phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="Enter rider phone number"
                    className={inputClassName()}
                  />
                </Field>

                <Field label="Vehicle Type" htmlFor="delivery-vehicle-type" required>
                  <select
                    id="delivery-vehicle-type"
                    value={form.vehicleType}
                    onChange={(e) => updateField("vehicleType", e.target.value)}
                    className={inputClassName()}
                  >
                    <option value="" className="bg-[#0A1324]">
                      Select vehicle type
                    </option>
                    <option value="Bike" className="bg-[#0A1324]">
                      Bike
                    </option>
                    <option value="Scooter" className="bg-[#0A1324]">
                      Scooter
                    </option>
                    <option value="Van" className="bg-[#0A1324]">
                      Van
                    </option>
                    <option value="Other" className="bg-[#0A1324]">
                      Other
                    </option>
                  </select>
                </Field>

                <Field label="Vehicle Number" htmlFor="delivery-vehicle-number">
                  <input
                    id="delivery-vehicle-number"
                    type="text"
                    value={form.vehicleNumber}
                    onChange={(e) => updateField("vehicleNumber", e.target.value)}
                    placeholder="Optional vehicle number"
                    className={inputClassName()}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Delivery Area" htmlFor="delivery-area" required>
                    <input
                      id="delivery-area"
                      type="text"
                      value={form.area}
                      onChange={(e) => updateField("area", e.target.value)}
                      placeholder="Kathmandu, Lalitpur, Bhaktapur, etc."
                      className={inputClassName()}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          Rider Status
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          Mark this delivery rider as active and available for order assignment.
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-3">
                        <span className="text-sm text-slate-300">Active</span>
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => updateField("isActive", e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500/40"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-900/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          Force Password Change
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          Rider must change password on next login.
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-3">
                        <span className="text-sm text-slate-300">Enabled</span>
                        <input
                          type="checkbox"
                          checked={form.forcePasswordChange}
                          onChange={(e) =>
                            updateField("forcePasswordChange", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500/40"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/50 pt-6">
                <div className="text-sm text-slate-400">
                  Inactive riders should not be assigned to new orders.
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/delivery/staff/${id}`}
                    className="rounded-xl border border-slate-700/50 bg-slate-900/25 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-900/35"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </AdminPageGuard>
  );
}