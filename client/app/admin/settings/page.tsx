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

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-[6px]">
      <div className="text-[12px] font-medium text-[#9ca3af]">{label}</div>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        "h-[44px] w-full rounded-[14px] border border-[#111827] bg-[#020617] px-[14px]",
        "text-[13px] text-white outline-none placeholder:text-[#6b7280]",
        "focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20",
        className,
      ].join(" ")}
    />
  );
}

function Button({
  variant = "solid",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "danger";
}) {
  const base =
    "h-[40px] rounded-[12px] px-[14px] text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
  const solid =
    "border border-[#111827] bg-[#1f2937] text-white hover:bg-[#0b1220]";
  const ghost =
    "border border-[#111827] bg-[#020617] text-white hover:bg-[#0b1220]";
  const danger =
    "border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[#fca5a5] hover:bg-[rgba(248,113,113,0.2)]";

  return (
    <button
      {...props}
      className={[
        base,
        variant === "ghost" ? ghost : variant === "danger" ? danger : solid,
        className,
      ].join(" ")}
    />
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "red";
}) {
  const base =
    "inline-flex min-w-[86px] items-center justify-center rounded-[10px] px-[12px] py-[6px] text-[12px] font-semibold";
  const neutral = "bg-[#1f2937] text-white";
  const green = "bg-[rgba(34,197,94,0.18)] text-[#4ade80]";
  const red = "bg-[rgba(248,113,113,0.18)] text-[#f97373]";

  return (
    <span
      className={[
        base,
        tone === "green" ? green : tone === "red" ? red : neutral,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
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
    <div className="fixed inset-0 z-[999] bg-black/70" onMouseDown={onClose}>
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 md:p-6">
        <div
          className="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-[18px] border border-[#111827] bg-[#020617] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[#111827] px-4 py-3 sm:px-5">
            <div className="text-[14px] font-semibold text-white">{title}</div>
            <button
              className="rounded-[10px] px-[10px] py-[6px] text-[14px] text-white hover:bg-[#0b1220]"
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrBox({ text }: { text: string }) {
  return (
    <div className="rounded-[12px] border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] px-[12px] py-[10px] text-[13px] text-[#fca5a5]">
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
    <label className="flex min-h-[52px] items-center gap-[10px] rounded-[14px] border border-[#111827] bg-[#020617] px-[14px] py-[12px] text-[14px] text-white transition hover:border-[#1f2937] hover:bg-[#06101f]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[#2563eb]"
      />
      <span className="leading-[1.35]">{label}</span>
    </label>
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
  const [statusLoadingId, setStatusLoadingId] = React.useState<string | null>(null);

  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openPass, setOpenPass] = React.useState(false);

  const [selectedAdmin, setSelectedAdmin] = React.useState<AdminRow | null>(null);

  const [aName, setAName] = React.useState("");
  const [aEmail, setAEmail] = React.useState("");
  const [permissions, setPermissions] = React.useState<AdminPermissions>(
    defaultAdminPermissions()
  );
  const [createErr, setCreateErr] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editStatus, setEditStatus] = React.useState<"active" | "inactive" | "invited">(
    "active"
  );
  const [editPermissions, setEditPermissions] = React.useState<AdminPermissions>(
    defaultAdminPermissions()
  );
  const [editErr, setEditErr] = React.useState("");
  const [updating, setUpdating] = React.useState(false);

  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [passErr, setPassErr] = React.useState("");
  const [changing, setChanging] = React.useState(false);

  const canViewAdmins = hasPermission(currentRole, currentPermissions, "adminsView");
  const canCreateAdmins = hasPermission(currentRole, currentPermissions, "adminsCreate");
  const canEditAdmins = hasPermission(currentRole, currentPermissions, "adminsEdit");
  const canDeleteAdmins = hasPermission(currentRole, currentPermissions, "adminsDelete");
  const canToggleAdminsStatus = hasPermission(currentRole, currentPermissions, "adminsStatus");

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
    setEditStatus((admin.status || "active") as "active" | "inactive" | "invited");
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
    } catch {}
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
      if (!res.ok) {
        return alert(j?.message || "Failed to save general settings");
      }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-semibold text-white">Settings</h1>
          <Link
            href="/admin/dashboard"
            className="text-[12px] text-[#60a5fa] hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <div className="text-[16px] font-medium text-white">Profile</div>
          <div className="mt-3 grid grid-cols-1 gap-[14px] md:grid-cols-2">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
          </div>

          <div className="mt-[14px] flex flex-wrap gap-[10px]">
            <Button onClick={onSaveProfile}>Save Profile</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPassErr("");
                setOpenPass(true);
              }}
            >
              Change Password
            </Button>
          </div>
        </section>

        <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
          <div className="text-[16px] font-medium text-white">General</div>
          <div className="mt-3 grid grid-cols-1 gap-[14px] md:grid-cols-2">
            <Field label="Store Name">
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="UFO Collection"
              />
            </Field>
            <Field label="Currency">
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="NPR"
              />
            </Field>
            <Field label="Support Email">
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@ufo.com"
              />
            </Field>
            <Field label="Support Phone">
              <Input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
              />
            </Field>
          </div>

          <div className="mt-[14px]">
            <Button onClick={onSaveGeneral}>Save General</Button>
          </div>
        </section>

        {canViewAdmins ? (
          <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
            <div className="flex flex-wrap items-center justify-between gap-[10px]">
              <div className="text-[16px] font-medium text-white">Admin Management</div>

              {canCreateAdmins ? (
                <Button
                  onClick={() => {
                    resetCreateForm();
                    setOpenCreate(true);
                  }}
                >
                  Invite Admin
                </Button>
              ) : null}
            </div>

            <div className="mt-[12px] overflow-x-auto rounded-[12px] border border-[#111827]">
              <table className="w-full min-w-[1040px] border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#0b1220] text-left text-[12px] text-[#9ca3af]">
                    <th className="px-[12px] py-[10px]">Name</th>
                    <th className="px-[12px] py-[10px]">Email</th>
                    <th className="px-[12px] py-[10px]">Role</th>
                    <th className="px-[12px] py-[10px]">Status</th>
                    <th className="px-[12px] py-[10px]">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingAdmins ? (
                    <tr>
                      <td colSpan={5} className="px-[12px] py-[12px] text-[#9ca3af]">
                        Loading admins...
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-[12px] py-[12px] text-[#9ca3af]">
                        No admins found.
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => {
                      const canDelete = canDeleteAdmins && a.role !== "superadmin";
                      const canEdit = canEditAdmins && a.role !== "superadmin";
                      const canStatus = canToggleAdminsStatus && a.role !== "superadmin";

                      return (
                        <tr key={a._id} className="border-t border-[#111827]">
                          <td className="px-[12px] py-[12px] text-white">{a.name}</td>
                          <td className="px-[12px] py-[12px] text-[#9ca3af]">
                            {a.email}
                          </td>
                          <td className="px-[12px] py-[12px]">
                            <Pill tone="neutral">{a.role}</Pill>
                          </td>
                          <td className="px-[12px] py-[12px]">
                            <Pill
                              tone={
                                a.status === "inactive"
                                  ? "red"
                                  : a.status === "invited"
                                  ? "neutral"
                                  : "green"
                              }
                            >
                              {a.status || "active"}
                            </Pill>
                          </td>
                          <td className="px-[12px] py-[12px]">
                            <div className="flex flex-wrap gap-2">
                              {canEdit ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => openEditModal(a)}
                                  className="h-[34px] px-[12px] text-[12px]"
                                >
                                  Edit
                                </Button>
                              ) : null}

                              {canStatus ? (
                                <Button
                                  variant="ghost"
                                  disabled={statusLoadingId === a._id}
                                  onClick={() => onToggleAdminStatus(a)}
                                  className="h-[34px] px-[12px] text-[12px]"
                                >
                                  {statusLoadingId === a._id
                                    ? "Saving..."
                                    : a.status === "inactive"
                                    ? "Activate"
                                    : "Deactivate"}
                                </Button>
                              ) : null}

                              {canDelete ? (
                                <Button
                                  variant="danger"
                                  disabled={deletingId === a._id}
                                  onClick={() => onDeleteAdmin(a)}
                                  className="h-[34px] px-[12px] text-[12px]"
                                >
                                  {deletingId === a._id ? "Deleting..." : "Delete"}
                                </Button>
                              ) : null}

                              {!canEdit && !canStatus && !canDelete ? (
                                <span className="text-[12px] text-[#6b7280]">—</span>
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

            <div className="mt-[10px] text-[12px] text-[#6b7280]">
              Superadmin can invite admins by email, edit permissions later, activate/deactivate
              them, and delete them permanently.
            </div>
          </section>
        ) : null}

        <Modal
          open={openCreate}
          title="Invite Admin"
          onClose={() => setOpenCreate(false)}
        >
          <div className="space-y-4">
            {createErr ? <ErrBox text={createErr} /> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name">
                <Input
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  placeholder="Admin name"
                />
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  value={aEmail}
                  onChange={(e) => setAEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </Field>
            </div>

            <div className="space-y-3">
              <div className="text-[12px] font-medium text-[#9ca3af]">
                Action-based permissions
              </div>

              {ADMIN_PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="rounded-[16px] border border-[#111827] bg-[#0b1220] p-4"
                >
                  <div className="mb-3 text-[15px] font-semibold text-white">
                    {group.title}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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

            <div className="sticky bottom-0 flex justify-end gap-[10px] border-t border-[#111827] bg-[#020617] pt-4">
              <Button
                variant="ghost"
                onClick={() => setOpenCreate(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button onClick={onInviteAdmin} disabled={creating}>
                {creating ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={openEdit}
          title="Edit Admin"
          onClose={() => setOpenEdit(false)}
        >
          <div className="space-y-4">
            {editErr ? <ErrBox text={editErr} /> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Admin name"
                />
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </Field>
            </div>

            <Field label="Status">
              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as "active" | "inactive" | "invited")
                }
                className="h-[44px] w-full rounded-[14px] border border-[#111827] bg-[#020617] px-[14px] text-[13px] text-white outline-none"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="invited">invited</option>
              </select>
            </Field>

            <div className="space-y-3">
              <div className="text-[12px] font-medium text-[#9ca3af]">
                Update permissions
              </div>

              {ADMIN_PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="rounded-[16px] border border-[#111827] bg-[#0b1220] p-4"
                >
                  <div className="mb-3 text-[15px] font-semibold text-white">
                    {group.title}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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

            <div className="sticky bottom-0 flex justify-end gap-[10px] border-t border-[#111827] bg-[#020617] pt-4">
              <Button
                variant="ghost"
                onClick={() => setOpenEdit(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={onUpdateAdmin} disabled={updating}>
                {updating ? "Updating..." : "Update Admin"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={openPass}
          title="Change Password"
          onClose={() => setOpenPass(false)}
        >
          <div className="space-y-[12px]">
            {passErr ? <ErrBox text={passErr} /> : null}

            <Field label="Old Password">
              <Input
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Enter old password"
              />
            </Field>

            <Field label="New Password">
              <Input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min 8 characters"
              />
            </Field>

            <Field label="Confirm New Password">
              <Input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Re-enter new password"
              />
            </Field>

            <div className="flex justify-end gap-[10px] pt-[4px]">
              <Button
                variant="ghost"
                onClick={() => setOpenPass(false)}
                disabled={changing}
              >
                Cancel
              </Button>
              <Button onClick={onChangePassword} disabled={changing}>
                {changing ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminPageGuard>
  );
}