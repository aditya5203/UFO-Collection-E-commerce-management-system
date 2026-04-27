"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminPageGuard from "../../../_components/AdminPageGuard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type FormState = {
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  area: string;
};

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const inputClass =
  "h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] font-medium text-white outline-none transition placeholder:text-[#7f879f] focus:border-[#8b5cf6]/60 focus:ring-4 focus:ring-[#8b5cf6]/10";
const primaryBtnClass =
  "rounded-full bg-white px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10";

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
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
        {required ? <span className="ml-1 text-red-300">*</span> : null}
      </label>
      {children}
    </div>
  );
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function CreateDeliveryStaffPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<FormState>({
    name: "",
    email: "",
    phone: "",
    vehicleType: "",
    vehicleNumber: "",
    area: "",
  });

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
      };

      const res = await fetch(`${API_BASE}/api/admin/delivery-staff/invite`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await safeJson(res);

      if (res.status === 401) {
        router.replace("/admin/adminlogin");
        return;
      }

      if (res.status === 403) {
        setError(
          (json as any)?.message ||
            "You do not have permission to create delivery staff."
        );
        return;
      }

      if (!res.ok) {
        setError((json as any)?.message || "Failed to send delivery invitation");
        return;
      }

      setSuccess("Delivery invitation sent successfully.");

      setTimeout(() => {
        router.push("/admin/delivery/staff");
      }, 700);
    } catch {
      setError("Failed to send delivery invitation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageGuard permission="deliveryStaffCreate">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="mx-auto max-w-5xl space-y-6">
          <section
            className={`${panelClass} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin / Delivery Staff / Invite
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Invite Delivery Staff
                </h1>

                <p className="mt-2 max-w-[650px] text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Invite a new delivery rider by email for order assignment and
                  delivery tracking.
                </p>
              </div>

              <Link href="/admin/delivery/staff" className={secondaryBtnClass}>
                Back to Staff
              </Link>
            </div>
          </section>

          {error ? (
            <div className="rounded-[20px] border border-red-400/20 bg-red-500/15 p-4 text-[13px] font-medium text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/15 p-4 text-[13px] font-medium text-emerald-300">
              {success}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className={`${panelClass} p-5 sm:p-6`}>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Full Name" htmlFor="delivery-name" required>
                <input
                  id="delivery-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter rider full name"
                  className={inputClass}
                />
              </Field>

              <Field label="Email" htmlFor="delivery-email" required>
                <input
                  id="delivery-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Enter rider email"
                  className={inputClass}
                />
              </Field>

              <Field label="Phone Number" htmlFor="delivery-phone" required>
                <input
                  id="delivery-phone"
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="Enter rider phone number"
                  className={inputClass}
                />
              </Field>

              <Field label="Vehicle Type" htmlFor="delivery-vehicle-type" required>
                <select
                 id="delivery-vehicle-type"
                 aria-label="Vehicle Type"
                 title="Vehicle Type"
                 value={form.vehicleType}
                onChange={(e) => updateField("vehicleType", e.target.value)}
                className={inputClass}
                >
                  <option value="" className="bg-[#11121a]">
                    Select vehicle type
                  </option>
                  <option value="Bike" className="bg-[#11121a]">
                    Bike
                  </option>
                  <option value="Scooter" className="bg-[#11121a]">
                    Scooter
                  </option>
                  <option value="Van" className="bg-[#11121a]">
                    Van
                  </option>
                  <option value="Other" className="bg-[#11121a]">
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
                  className={inputClass}
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
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-[#26293a] pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-[560px] text-[13px] leading-6 text-[#a7aec4]">
                After the invitation is accepted and password is set, this rider
                can be selected while assigning orders.
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/admin/delivery/staff" className={secondaryBtnClass}>
                  Cancel
                </Link>

                <button type="submit" disabled={saving} className={primaryBtnClass}>
                  {saving ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminPageGuard>
  );
}