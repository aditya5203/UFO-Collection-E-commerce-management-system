// client/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ADMIN_PERMISSION_GROUPS,
  AdminPermissions,
  AdminPermissionKey,
  AdminSettingsResponse,
  defaultAdminPermissions,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";
import AdminPageGuard from "../_components/AdminPageGuard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type AdminRow = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  status?: "active" | "inactive" | "invited";
  mustChangePassword?: boolean;
  permissions?: Partial<AdminPermissions>;
};

const shellClass = "min-h-screen bg-[#0a0a0f] text-[#f5f7fb]";
const shellCard =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const softCard =
  "rounded-[20px] border border-[#26293a] bg-[#161824] shadow-[0_14px_40px_rgba(0,0,0,0.22)]";
const inputClass =
  "h-12 w-full rounded-2xl border border-[#26293a] bg-[#0d0f17] px-4 text-[13px] font-medium text-white placeholder:text-[#7f879f] outline-none transition focus:border-[#8b5cf6]/60 focus:ring-4 focus:ring-[#8b5cf6]/10";
const buttonBase =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-[12px] font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-60";

async function safeJson(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;

  return <input {...rest} className={`${inputClass} ${className}`} />;
}

function Button({
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "danger" | "success";
}) {
  const styles = {
    solid: "bg-white text-[#090a12] hover:-translate-y-0.5 hover:bg-white/90",
    success:
      "bg-emerald-400 text-[#07110d] hover:-translate-y-0.5 hover:bg-emerald-300",
    ghost:
      "border border-white/15 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/10",
    danger:
      "border border-red-400/25 bg-red-500/15 text-red-300 hover:-translate-y-0.5 hover:bg-red-500/20",
  };

  return (
    <button
      {...props}
      className={`${buttonBase} ${styles[variant]} ${className}`}
    />
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "blue" | "amber";
}) {
  const styles = {
    neutral: "border-white/10 bg-white/5 text-[#a7aec4]",
    green: "border-emerald-400/20 bg-emerald-500/15 text-emerald-300",
    red: "border-red-400/20 bg-red-500/15 text-red-300",
    blue: "border-blue-400/20 bg-blue-500/15 text-blue-300",
    amber: "border-amber-400/20 bg-amber-500/15 text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-[28px] border border-[#26293a] bg-[#11121a] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#26293a] px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>

              {subtitle ? (
                <p className="mt-1 text-[13px] text-[#a7aec4]">{subtitle}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrBox({ text }: { text: string }) {
  return (
    <div className="rounded-[18px] border border-red-400/20 bg-red-500/15 px-4 py-3 text-[13px] font-medium text-red-300">
      {text}
    </div>
  );
}

function PermissionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-[56px] cursor-pointer items-center gap-3 rounded-2xl border border-[#26293a] bg-white/[0.03] px-4 py-3 text-[13px] text-white transition hover:border-[#8b5cf6]/45 hover:bg-white/[0.05]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[#8b5cf6]"
      />

      <span className="leading-5">{label}</span>
    </label>
  );
}

function StatBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className={`${softCard} p-5`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a7aec4]">
        {label}
      </div>

      <div className="mt-3 text-[26px] font-semibold tracking-[-0.03em] text-white">
        {value}
      </div>

      {hint ? <div className="mt-2 text-[12px] text-[#7f879f]">{hint}</div> : null}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [currentRole, setCurrentRole] = React.useState<"admin" | "superadmin">(
    "admin"
  );
  const [currentPermissions, setCurrentPermissions] =
    React.useState<AdminPermissions>(defaultAdminPermissions());

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  const [storeName, setStoreName] = React.useState("");
  const [supportEmail, setSupportEmail] = React.useState("");
  const [supportPhone, setSupportPhone] = React.useState("");
  const [currency, setCurrency] = React.useState("NPR");

  const [admins, setAdmins] = React.useState<AdminRow[]>([]);
  const [loadingAdmins, setLoadingAdmins] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [statusLoadingId, setStatusLoadingId] = React.useState<string | null>(
    null
  );

  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openPass, setOpenPass] = React.useState(false);

  const [selectedAdmin, setSelectedAdmin] = React.useState<AdminRow | null>(
    null
  );

  const [aName, setAName] = React.useState("");
  const [aEmail, setAEmail] = React.useState("");
  const [permissions, setPermissions] = React.useState<AdminPermissions>(
    defaultAdminPermissions()
  );
  const [createErr, setCreateErr] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<
    "active" | "inactive" | "invited"
  >("active");
  const [editPermissions, setEditPermissions] =
    React.useState<AdminPermissions>(defaultAdminPermissions());
  const [editErr, setEditErr] = React.useState("");
  const [updating, setUpdating] = React.useState(false);

  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [passErr, setPassErr] = React.useState("");
  const [changing, setChanging] = React.useState(false);

  const canViewAdmins = hasPermission(
    currentRole,
    currentPermissions,
    "adminsView"
  );
  const canCreateAdmins = hasPermission(
    currentRole,
    currentPermissions,
    "adminsCreate"
  );
  const canEditAdmins = hasPermission(
    currentRole,
    currentPermissions,
    "adminsEdit"
  );
  const canDeleteAdmins = hasPermission(
    currentRole,
    currentPermissions,
    "adminsDelete"
  );
  const canToggleAdminsStatus = hasPermission(
    currentRole,
    currentPermissions,
    "adminsStatus"
  );

  const adminStats = React.useMemo(() => {
    const total = admins.length;
    const active = admins.filter((a) => (a.status || "active") === "active")
      .length;
    const invited = admins.filter((a) => a.status === "invited").length;
    const inactive = admins.filter((a) => a.status === "inactive").length;

    return { total, active, invited, inactive };
  }, [admins]);

  const togglePermission = (key: AdminPermissionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleEditPermission = (key: AdminPermissionKey) => {
    setEditPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetCreateForm = () => {
    setCreateErr("");
    setAName("");
    setAEmail("");
    setPermissions(defaultAdminPermissions());
  };

  const openEditModal = (admin: AdminRow) => {
    setSelectedAdmin(admin);
    setEditErr("");
    setEditName(admin.name || "");
    setEditEmail(admin.email || "");
    setEditStatus(
      (admin.status || "active") as "active" | "inactive" | "invited"
    );
    setEditPermissions(normalizeAdminPermissions("admin", admin.permissions));
    setOpenEdit(true);
  };

  const loadAdmins = React.useCallback(async () => {
    try {
      setLoadingAdmins(true);

      const res = await fetch(`${API_BASE_URL}/api/admins`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setAdmins([]);
        return;
      }

      const j = await safeJson(res);
      const items = Array.isArray(j?.items) ? j.items : [];
      setAdmins(items);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const loadSettings = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) return;

      const j = (await safeJson(res)) as AdminSettingsResponse;
      const role = (j?.profile?.role || "admin") as "admin" | "superadmin";
      const normalizedPermissions = normalizeAdminPermissions(
        role,
        j?.profile?.permissions
      );

      setName(j?.profile?.name || "");
      setEmail(j?.profile?.email || "");
      setCurrentRole(role);
      setCurrentPermissions(normalizedPermissions);

      setStoreName(j?.general?.storeName || "");
      setSupportEmail(j?.general?.supportEmail || "");
      setSupportPhone(j?.general?.supportPhone || "");
      setCurrency(j?.general?.currency || "NPR");
    } catch {
      // silent
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  React.useEffect(() => {
    if (canViewAdmins) {
      loadAdmins();
    } else {
      setAdmins([]);
    }
  }, [canViewAdmins, loadAdmins]);

  const onSaveProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const j = await safeJson(res);
      if (!res.ok) return alert(j?.message || "Failed to save profile");

      alert("Profile saved ✅");
    } catch {
      alert("Network error");
    }
  };

  const onSaveGeneral = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: storeName.trim(),
          supportEmail: supportEmail.trim(),
          supportPhone: supportPhone.trim(),
          currency: currency.trim(),
        }),
      });

      const j = await safeJson(res);
      if (!res.ok) return alert(j?.message || "Failed to save general settings");

      alert("General settings saved ✅");
    } catch {
      alert("Network error");
    }
  };

  const onInviteAdmin = async () => {
    setCreateErr("");

    const n = aName.trim();
    const e = aEmail.trim().toLowerCase();

    if (!n) return setCreateErr("Name is required");
    if (!e) return setCreateErr("Email is required");

    try {
      setCreating(true);

      const res = await fetch(`${API_BASE_URL}/api/admins/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          email: e,
          role: "admin",
          permissions,
        }),
      });

      const j = await safeJson(res);

      if (!res.ok) {
        setCreateErr(j?.message || "Failed to send admin invitation");
        return;
      }

      setOpenCreate(false);
      resetCreateForm();
      await loadAdmins();
      alert("Admin invitation sent ✅");
    } catch {
      setCreateErr("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const onUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    setEditErr("");

    const n = editName.trim();
    const e = editEmail.trim().toLowerCase();

    if (!n) return setEditErr("Name is required");
    if (!e) return setEditErr("Email is required");

    try {
      setUpdating(true);

      const res = await fetch(`${API_BASE_URL}/api/admins/${selectedAdmin._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          email: e,
          status: editStatus,
          permissions: editPermissions,
        }),
      });

      const j = await safeJson(res);

      if (!res.ok) {
        setEditErr(j?.message || "Failed to update admin");
        return;
      }

      setOpenEdit(false);
      setSelectedAdmin(null);
      await loadAdmins();
      alert("Admin updated ✅");
    } catch {
      setEditErr("Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const onToggleAdminStatus = async (admin: AdminRow) => {
    if (!canToggleAdminsStatus) {
      alert("You do not have permission to change admin status.");
      return;
    }

    if (admin.role === "superadmin") {
      alert("Superadmin account status cannot be changed from here.");
      return;
    }

    const action = admin.status === "inactive" ? "activate" : "deactivate";
    const ok = window.confirm(`Are you sure you want to ${action} ${admin.name}?`);
    if (!ok) return;

    try {
      setStatusLoadingId(admin._id);

      const res = await fetch(`${API_BASE_URL}/api/admins/${admin._id}/status`, {
        method: "PATCH",
        credentials: "include",
      });

      const j = await safeJson(res);

      if (!res.ok) {
        alert(j?.message || "Failed to update status");
        return;
      }

      await loadAdmins();
      alert(j?.message || "Status updated ✅");
    } catch {
      alert("Network error");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const onDeleteAdmin = async (admin: AdminRow) => {
    if (!canDeleteAdmins) {
      alert("You do not have permission to delete admin.");
      return;
    }

    if (admin.role === "superadmin") {
      alert("Superadmin account cannot be deleted from here.");
      return;
    }

    const ok = window.confirm(
      `Are you sure you want to delete ${admin.name} (${admin.email})? This will permanently delete the account from the database.`
    );

    if (!ok) return;

    try {
      setDeletingId(admin._id);

      const res = await fetch(`${API_BASE_URL}/api/admins/${admin._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const j = await safeJson(res);

      if (!res.ok) {
        alert(j?.message || "Failed to delete admin");
        return;
      }

      await loadAdmins();
      alert("Admin deleted ✅");
    } catch {
      alert("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const onChangePassword = async () => {
    setPassErr("");

    if (!oldPass) return setPassErr("Old password is required");

    if (newPass.length < 8) {
      return setPassErr("New password must be at least 8 characters");
    }

    if (newPass !== confirmPass) {
      return setPassErr("New password and confirm password do not match");
    }

    try {
      setChanging(true);

      const res = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });

      const j = await safeJson(res);

      if (!res.ok) {
        setPassErr(j?.message || "Failed to change password");
        return;
      }

      setOpenPass(false);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
      await loadAdmins();
      await loadSettings();
      alert("Password changed ✅");
    } catch {
      setPassErr("Network error. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  return (
    <AdminPageGuard permission="settingsView">
      <div className={`${shellClass} -m-6 p-4 sm:p-6 lg:p-8`}>
        <div className="space-y-6">
          <section
            className={`${shellCard} bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,#11121a,#0d0f17)] p-5 sm:p-6`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4] sm:text-[12px]">
                  Admin / Settings
                </div>

                <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-white sm:text-[36px]">
                  Settings
                </h1>

                <p className="mt-2 max-w-3xl text-[13px] leading-7 text-[#a7aec4] sm:text-[14px]">
                  Manage your profile, store details, admin accounts, and
                  role-based permissions from one secure premium control panel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Pill tone={currentRole === "superadmin" ? "blue" : "neutral"}>
                  {currentRole}
                </Pill>

                <Link
                  href="/admin/dashboard"
                  className="inline-flex h-11 items-center rounded-full border border-white/15 bg-white/5 px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className={`${shellCard} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Account
                  </div>

                  <h2 className="mt-1 text-[20px] font-semibold text-white">
                    Profile
                  </h2>

                  <p className="mt-1 text-[13px] text-[#a7aec4]">
                    Update your admin account information.
                  </p>
                </div>

                <Pill tone="green">Account</Pill>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Name" htmlFor="profileName">
                  <Input
                    id="profileName"
                    name="profileName"
                    title="Profile name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </Field>

                <Field label="Email" htmlFor="profileEmail">
                  <Input
                    id="profileEmail"
                    name="profileEmail"
                    title="Profile email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-[#26293a] pt-5">
                <Button type="button" onClick={onSaveProfile}>
                  Save Profile
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setPassErr("");
                    setOpenPass(true);
                  }}
                >
                  Change Password
                </Button>
              </div>
            </div>

            <div className={`${shellCard} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                    Store
                  </div>

                  <h2 className="mt-1 text-[20px] font-semibold text-white">
                    General
                  </h2>

                  <p className="mt-1 text-[13px] text-[#a7aec4]">
                    Configure store information used across the admin system.
                  </p>
                </div>

                <Pill tone="blue">Store</Pill>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Store Name" htmlFor="storeName">
                  <Input
                    id="storeName"
                    name="storeName"
                    title="Store name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="UFO Collection"
                  />
                </Field>

                <Field label="Currency" htmlFor="currency">
                  <Input
                    id="currency"
                    name="currency"
                    title="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="NPR"
                  />
                </Field>

                <Field label="Support Email" htmlFor="supportEmail">
                  <Input
                    id="supportEmail"
                    name="supportEmail"
                    title="Support email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@ufo.com"
                  />
                </Field>

                <Field label="Support Phone" htmlFor="supportPhone">
                  <Input
                    id="supportPhone"
                    name="supportPhone"
                    title="Support phone"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+977 98XXXXXXXX"
                  />
                </Field>
              </div>

              <div className="mt-6 border-t border-[#26293a] pt-5">
                <Button type="button" onClick={onSaveGeneral}>
                  Save General
                </Button>
              </div>
            </div>
          </section>

          {canViewAdmins ? (
            <section className={`${shellCard} overflow-hidden`}>
              <div className="border-b border-[#26293a] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[#a7aec4]">
                      Admins
                    </div>

                    <h2 className="mt-1 text-[20px] font-semibold text-white">
                      Admin Management
                    </h2>

                    <p className="mt-1 text-[13px] text-[#a7aec4]">
                      Invite admins, update permissions, control account status,
                      and remove accounts from the database.
                    </p>
                  </div>

                  {canCreateAdmins ? (
                    <Button
                      type="button"
                      onClick={() => {
                        resetCreateForm();
                        setOpenCreate(true);
                      }}
                    >
                      + Invite Admin
                    </Button>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatBox
                    label="Total Admins"
                    value={adminStats.total}
                    hint="All admin accounts"
                  />

                  <StatBox
                    label="Active"
                    value={adminStats.active}
                    hint="Can access panel"
                  />

                  <StatBox
                    label="Invited"
                    value={adminStats.invited}
                    hint="Waiting acceptance"
                  />

                  <StatBox
                    label="Inactive"
                    value={adminStats.inactive}
                    hint="Access disabled"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[#26293a] text-left text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                      <th className="px-5 py-4 font-medium">Admin</th>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Role</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingAdmins ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
                        >
                          Loading admins...
                        </td>
                      </tr>
                    ) : admins.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-[13px] text-[#a7aec4]"
                        >
                          No admins found.
                        </td>
                      </tr>
                    ) : (
                      admins.map((a) => {
                        const canDelete =
                          canDeleteAdmins && a.role !== "superadmin";
                        const canEdit = canEditAdmins && a.role !== "superadmin";
                        const canStatus =
                          canToggleAdminsStatus && a.role !== "superadmin";
                        const status = a.status || "active";

                        return (
                          <tr
                            key={a._id}
                            className="border-t border-[#26293a] transition hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[12px] font-semibold text-white">
                                  {(a.name || "A").slice(0, 2).toUpperCase()}
                                </div>

                                <div>
                                  <div className="font-semibold text-white">
                                    {a.name}
                                  </div>

                                  <div className="mt-1 text-[12px] text-[#7f879f]">
                                    {a.mustChangePassword
                                      ? "Password change required"
                                      : "Admin account"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-[#a7aec4]">
                              {a.email}
                            </td>

                            <td className="px-5 py-4">
                              <Pill
                                tone={
                                  a.role === "superadmin" ? "blue" : "neutral"
                                }
                              >
                                {a.role}
                              </Pill>
                            </td>

                            <td className="px-5 py-4">
                              <Pill
                                tone={
                                  status === "inactive"
                                    ? "red"
                                    : status === "invited"
                                    ? "amber"
                                    : "green"
                                }
                              >
                                {status}
                              </Pill>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                {canEdit ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => openEditModal(a)}
                                    className="h-9 px-3 text-[11px]"
                                  >
                                    Edit
                                  </Button>
                                ) : null}

                                {canStatus ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={statusLoadingId === a._id}
                                    onClick={() => onToggleAdminStatus(a)}
                                    className="h-9 px-3 text-[11px]"
                                  >
                                    {statusLoadingId === a._id
                                      ? "Saving..."
                                      : status === "inactive"
                                      ? "Activate"
                                      : "Deactivate"}
                                  </Button>
                                ) : null}

                                {canDelete ? (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    disabled={deletingId === a._id}
                                    onClick={() => onDeleteAdmin(a)}
                                    className="h-9 px-3 text-[11px]"
                                  >
                                    {deletingId === a._id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </Button>
                                ) : null}

                                {!canEdit && !canStatus && !canDelete ? (
                                  <span className="text-[13px] text-[#7f879f]">
                                    —
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#26293a] px-6 py-4 text-[13px] text-[#7f879f]">
                Superadmin accounts are protected. Only normal admin accounts can
                be edited, deactivated, or permanently deleted from here.
              </div>
            </section>
          ) : null}

          <Modal
            open={openCreate}
            title="Invite Admin"
            subtitle="Create an admin invitation and assign action-based permissions."
            onClose={() => setOpenCreate(false)}
          >
            <div className="space-y-6">
              {createErr ? <ErrBox text={createErr} /> : null}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Full Name" htmlFor="createAdminName">
                  <Input
                    id="createAdminName"
                    name="createAdminName"
                    title="Admin name"
                    value={aName}
                    onChange={(e) => setAName(e.target.value)}
                    placeholder="Admin name"
                  />
                </Field>

                <Field label="Email" htmlFor="createAdminEmail">
                  <Input
                    id="createAdminEmail"
                    name="createAdminEmail"
                    title="Admin email"
                    type="email"
                    value={aEmail}
                    onChange={(e) => setAEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </Field>
              </div>

              <div className="space-y-4">
                {ADMIN_PERMISSION_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-[24px] border border-[#26293a] bg-white/[0.03] p-5"
                  >
                    <h3 className="text-[15px] font-semibold text-white">
                      {group.title}
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {group.items.map((item) => (
                        <PermissionCheckbox
                          key={item.key}
                          label={item.label}
                          checked={permissions[item.key]}
                          onChange={() => togglePermission(item.key)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#26293a] bg-[#11121a] pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenCreate(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>

                <Button type="button" onClick={onInviteAdmin} disabled={creating}>
                  {creating ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            open={openEdit}
            title="Edit Admin"
            subtitle="Update admin details, status, and module permissions."
            onClose={() => setOpenEdit(false)}
          >
            <div className="space-y-6">
              {editErr ? <ErrBox text={editErr} /> : null}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Full Name" htmlFor="editAdminName">
                  <Input
                    id="editAdminName"
                    name="editAdminName"
                    title="Edit admin name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Admin name"
                  />
                </Field>

                <Field label="Email" htmlFor="editAdminEmail">
                  <Input
                    id="editAdminEmail"
                    name="editAdminEmail"
                    title="Edit admin email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </Field>
              </div>

              <Field label="Status" htmlFor="editAdminStatus">
                <select
                  id="editAdminStatus"
                  name="editAdminStatus"
                  title="Admin status"
                  aria-label="Admin status"
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(
                      e.target.value as "active" | "inactive" | "invited"
                    )
                  }
                  className={inputClass}
                >
                  <option value="active" className="bg-[#11121a]">
                    Active
                  </option>

                  <option value="inactive" className="bg-[#11121a]">
                    Inactive
                  </option>

                  <option value="invited" className="bg-[#11121a]">
                    Invited
                  </option>
                </select>
              </Field>

              <div className="space-y-4">
                {ADMIN_PERMISSION_GROUPS.map((group) => (
                  <div
                    key={group.title}
                    className="rounded-[24px] border border-[#26293a] bg-white/[0.03] p-5"
                  >
                    <h3 className="text-[15px] font-semibold text-white">
                      {group.title}
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {group.items.map((item) => (
                        <PermissionCheckbox
                          key={item.key}
                          label={item.label}
                          checked={editPermissions[item.key]}
                          onChange={() => toggleEditPermission(item.key)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#26293a] bg-[#11121a] pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenEdit(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>

                <Button type="button" onClick={onUpdateAdmin} disabled={updating}>
                  {updating ? "Updating..." : "Update Admin"}
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            open={openPass}
            title="Change Password"
            subtitle="Update your admin login password securely."
            onClose={() => setOpenPass(false)}
          >
            <div className="space-y-5">
              {passErr ? <ErrBox text={passErr} /> : null}

              <Field label="Old Password" htmlFor="oldPassword">
                <Input
                  id="oldPassword"
                  name="oldPassword"
                  title="Old password"
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  placeholder="Enter old password"
                />
              </Field>

              <Field label="New Password" htmlFor="newPassword">
                <Input
                  id="newPassword"
                  name="newPassword"
                  title="New password"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </Field>

              <Field label="Confirm New Password" htmlFor="confirmNewPassword">
                <Input
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  title="Confirm new password"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </Field>

              <div className="flex justify-end gap-3 border-t border-[#26293a] pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenPass(false)}
                  disabled={changing}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={onChangePassword}
                  disabled={changing}
                >
                  {changing ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </AdminPageGuard>
  );
}