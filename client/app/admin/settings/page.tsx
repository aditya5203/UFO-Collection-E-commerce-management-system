"use client";

import * as React from "react";
import {
  AdminPermissions,
  AdminPermissionKey,
  AdminSettingsResponse,
  defaultAdminPermissions,
  hasPermission,
  normalizeAdminPermissions,
} from "../_components/adminPermissions";
import AdminPageGuard from "../_components/AdminPageGuard";

import AdminFormModal from "./_components/AdminFormModal";
import AdminManagement from "./_components/AdminManagement";
import ChangePasswordModal from "./_components/ChangePasswordModal";
import ProfileGeneralSettings from "./_components/ProfileGeneralSettings";
import SettingsHeader from "./_components/SettingsHeader";
import {
  API_BASE_URL,
  AdminRow,
  safeJson,
  shellClass,
} from "./_components/settingsTypes";

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

  const openCreateModal = () => {
    resetCreateForm();
    setOpenCreate(true);
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
          <SettingsHeader currentRole={currentRole} />

          <ProfileGeneralSettings
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
            storeName={storeName}
            setStoreName={setStoreName}
            supportEmail={supportEmail}
            setSupportEmail={setSupportEmail}
            supportPhone={supportPhone}
            setSupportPhone={setSupportPhone}
            currency={currency}
            setCurrency={setCurrency}
            onSaveProfile={onSaveProfile}
            onSaveGeneral={onSaveGeneral}
            onOpenPassword={() => {
              setPassErr("");
              setOpenPass(true);
            }}
          />

          <AdminManagement
            canViewAdmins={canViewAdmins}
            canCreateAdmins={canCreateAdmins}
            canEditAdmins={canEditAdmins}
            canDeleteAdmins={canDeleteAdmins}
            canToggleAdminsStatus={canToggleAdminsStatus}
            admins={admins}
            adminStats={adminStats}
            loadingAdmins={loadingAdmins}
            deletingId={deletingId}
            statusLoadingId={statusLoadingId}
            onOpenCreate={openCreateModal}
            openEditModal={openEditModal}
            onToggleAdminStatus={onToggleAdminStatus}
            onDeleteAdmin={onDeleteAdmin}
          />

          <AdminFormModal
            mode="create"
            open={openCreate}
            onClose={() => setOpenCreate(false)}
            error={createErr}
            name={aName}
            setName={setAName}
            email={aEmail}
            setEmail={setAEmail}
            permissions={permissions}
            onTogglePermission={togglePermission}
            loading={creating}
            onSubmit={onInviteAdmin}
          />

          <AdminFormModal
            mode="edit"
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            error={editErr}
            name={editName}
            setName={setEditName}
            email={editEmail}
            setEmail={setEditEmail}
            status={editStatus}
            setStatus={setEditStatus}
            permissions={editPermissions}
            onTogglePermission={toggleEditPermission}
            loading={updating}
            onSubmit={onUpdateAdmin}
          />

          <ChangePasswordModal
            open={openPass}
            onClose={() => setOpenPass(false)}
            passErr={passErr}
            oldPass={oldPass}
            setOldPass={setOldPass}
            newPass={newPass}
            setNewPass={setNewPass}
            confirmPass={confirmPass}
            setConfirmPass={setConfirmPass}
            changing={changing}
            onChangePassword={onChangePassword}
          />
        </div>
      </div>
    </AdminPageGuard>
  );
}