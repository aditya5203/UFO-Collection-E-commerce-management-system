// client/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

type AdminRow = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  status?: "active" | "inactive" | "invited";
};

type SettingsPayload = {
  profile?: { name?: string; email?: string };
  general?: {
    storeName?: string;
    supportEmail?: string;
    supportPhone?: string;
    currency?: string;
  };
};

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/* -------------------- UI helpers (match dashboard style) -------------------- */

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
  variant?: "solid" | "ghost";
}) {
  const base =
    "h-[40px] rounded-[12px] px-[14px] text-[13px] font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const solid =
    "border border-[#111827] bg-[#1f2937] text-white hover:bg-[#0b1220]";
  const ghost =
    "border border-[#111827] bg-[#020617] text-white hover:bg-[#0b1220]";
  return (
    <button
      {...props}
      className={[base, variant === "ghost" ? ghost : solid, className].join(
        " "
      )}
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
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] grid place-items-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-[14px] border border-[#111827] bg-[#020617] shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#111827] px-[14px] py-[12px]">
          <div className="text-[13px] font-semibold text-white">{title}</div>
          <button
            className="rounded-[10px] px-[10px] py-[6px] text-[14px] text-white hover:bg-[#0b1220]"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-[14px]">{children}</div>
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

/* -------------------- Page -------------------- */

export default function AdminSettingsPage() {
  // Profile
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  // General
  const [storeName, setStoreName] = React.useState("");
  const [supportEmail, setSupportEmail] = React.useState("");
  const [supportPhone, setSupportPhone] = React.useState("");
  const [currency, setCurrency] = React.useState("NPR");

  // Security (admins)
  const [admins, setAdmins] = React.useState<AdminRow[]>([]);
  const [loadingAdmins, setLoadingAdmins] = React.useState(false);

  // Modals
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openPass, setOpenPass] = React.useState(false);

  // Create Admin form
  const [aName, setAName] = React.useState("");
  const [aEmail, setAEmail] = React.useState("");
  const [aPass, setAPass] = React.useState("");
  const [createErr, setCreateErr] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Change Password form
  const [oldPass, setOldPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");
  const [passErr, setPassErr] = React.useState("");
  const [changing, setChanging] = React.useState(false);

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
      const items = Array.isArray(j?.items) ? j.items : Array.isArray(j) ? j : [];
      setAdmins(items);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  const loadSettings = React.useCallback(async () => {
    // Optional endpoints; page works even if not connected
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const j = (await safeJson(res)) as SettingsPayload;

      setName(j?.profile?.name || "");
      setEmail(j?.profile?.email || "");

      setStoreName(j?.general?.storeName || "");
      setSupportEmail(j?.general?.supportEmail || "");
      setSupportPhone(j?.general?.supportPhone || "");
      setCurrency(j?.general?.currency || "NPR");
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    loadAdmins();
    loadSettings();
  }, [loadAdmins, loadSettings]);

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

  const onCreateAdmin = async () => {
    setCreateErr("");

    const n = aName.trim();
    const e = aEmail.trim().toLowerCase();

    if (!n) return setCreateErr("Name is required");
    if (!e) return setCreateErr("Email is required");
    if (aPass.length < 8) return setCreateErr("Password must be at least 8 characters");

    try {
      setCreating(true);
      const res = await fetch(`${API_BASE_URL}/api/admins`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: e, password: aPass, role: "admin" }),
      });
      const j = await safeJson(res);
      if (!res.ok) {
        setCreateErr(j?.message || "Failed to create admin");
        return;
      }

      setOpenCreate(false);
      setAName("");
      setAEmail("");
      setAPass("");
      await loadAdmins();
      alert("Admin created ✅");
    } catch {
      setCreateErr("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const onChangePassword = async () => {
    setPassErr("");

    if (!oldPass) return setPassErr("Old password is required");
    if (newPass.length < 8) return setPassErr("New password must be at least 8 characters");
    if (newPass !== confirmPass) return setPassErr("New password and confirm password do not match");

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
      alert("Password changed ✅");
    } catch {
      setPassErr("Network error. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title (match dashboard size) */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-white">Settings</h1>
        <Link href="/admin/dashboard" className="text-[12px] text-[#60a5fa] hover:underline">
          Back to Dashboard
        </Link>
      </div>

      {/* PROFILE */}
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="text-[16px] font-medium text-white">Profile</div>
        <div className="mt-3 grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
        </div>

        <div className="mt-[14px] flex flex-wrap gap-[10px]">
          <Button onClick={onSaveProfile}>Save Profile</Button>
          <Button variant="ghost" onClick={() => { setPassErr(""); setOpenPass(true); }}>
            Change Password
          </Button>
        </div>
      </section>

      {/* GENERAL */}
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="text-[16px] font-medium text-white">General</div>
        <div className="mt-3 grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <Field label="Store Name">
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="UFO Collection" />
          </Field>
          <Field label="Currency">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="NPR" />
          </Field>
          <Field label="Support Email">
            <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@ufo.com" />
          </Field>
          <Field label="Support Phone">
            <Input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} placeholder="+977 98XXXXXXXX" />
          </Field>
        </div>

        <div className="mt-[14px]">
          <Button onClick={onSaveGeneral}>Save General</Button>
        </div>
      </section>

      {/* SECURITY */}
      <section className="rounded-[14px] border border-[#111827] bg-[#020617] px-[18px] pb-[18px] pt-[16px]">
        <div className="flex flex-wrap items-center justify-between gap-[10px]">
          <div className="text-[16px] font-medium text-white">Security</div>
          <Button
            onClick={() => {
              setCreateErr("");
              setAName("");
              setAEmail("");
              setAPass("");
              setOpenCreate(true);
            }}
          >
            Create New Admin
          </Button>
        </div>

        <div className="mt-[12px] overflow-x-auto rounded-[12px] border border-[#111827]">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#0b1220] text-left text-[12px] text-[#9ca3af]">
                <th className="px-[12px] py-[10px]">Name</th>
                <th className="px-[12px] py-[10px]">Email</th>
                <th className="px-[12px] py-[10px]">Role</th>
                <th className="px-[12px] py-[10px]">Status</th>
              </tr>
            </thead>

            <tbody>
              {loadingAdmins ? (
                <tr>
                  <td colSpan={4} className="px-[12px] py-[12px] text-[#9ca3af]">
                    Loading admins...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-[12px] py-[12px] text-[#9ca3af]">
                    No admins found (or API not connected).
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a._id} className="border-t border-[#111827]">
                    <td className="px-[12px] py-[12px] text-white">{a.name}</td>
                    <td className="px-[12px] py-[12px] text-[#9ca3af]">{a.email}</td>
                    <td className="px-[12px] py-[12px]">
                      <Pill tone="neutral">{a.role}</Pill>
                    </td>
                    <td className="px-[12px] py-[12px]">
                      <Pill tone={a.status === "inactive" ? "red" : "green"}>
                        {a.status || "active"}
                      </Pill>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-[10px] text-[12px] text-[#6b7280]">
          Tip: allow only <span className="text-white">superadmin</span> to create admins (backend enforced).
        </div>
      </section>

      {/* Create Admin Modal */}
      <Modal open={openCreate} title="Create New Admin" onClose={() => setOpenCreate(false)}>
        <div className="space-y-[12px]">
          {createErr ? <ErrBox text={createErr} /> : null}

          <Field label="Full Name">
            <Input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Admin name" />
          </Field>

          <Field label="Email">
            <Input value={aEmail} onChange={(e) => setAEmail(e.target.value)} placeholder="admin@example.com" />
          </Field>

          <Field label="Password">
            <Input type="password" value={aPass} onChange={(e) => setAPass(e.target.value)} placeholder="Min 8 characters" />
          </Field>

          <div className="flex justify-end gap-[10px] pt-[4px]">
            <Button variant="ghost" onClick={() => setOpenCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={onCreateAdmin} disabled={creating}>
              {creating ? "Creating..." : "Create Admin"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={openPass} title="Change Password" onClose={() => setOpenPass(false)}>
        <div className="space-y-[12px]">
          {passErr ? <ErrBox text={passErr} /> : null}

          <Field label="Old Password">
            <Input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Enter old password" />
          </Field>

          <Field label="New Password">
            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 8 characters" />
          </Field>

          <Field label="Confirm New Password">
            <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Re-enter new password" />
          </Field>

          <div className="flex justify-end gap-[10px] pt-[4px]">
            <Button variant="ghost" onClick={() => setOpenPass(false)} disabled={changing}>
              Cancel
            </Button>
            <Button onClick={onChangePassword} disabled={changing}>
              {changing ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
