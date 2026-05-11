"use client";

import * as React from "react";
import type { AdminStats, AdminRow } from "./settingsTypes";
import { shellCard } from "./settingsTypes";
import { Button, Pill, StatBox } from "./SettingsShared";

type Props = {
  canViewAdmins: boolean;
  canCreateAdmins: boolean;
  canEditAdmins: boolean;
  canDeleteAdmins: boolean;
  canToggleAdminsStatus: boolean;
  admins: AdminRow[];
  adminStats: AdminStats;
  loadingAdmins: boolean;
  deletingId: string | null;
  statusLoadingId: string | null;
  onOpenCreate: () => void;
  openEditModal: (admin: AdminRow) => void;
  onToggleAdminStatus: (admin: AdminRow) => void;
  onDeleteAdmin: (admin: AdminRow) => void;
};

export default function AdminManagement({
  canViewAdmins,
  canCreateAdmins,
  canEditAdmins,
  canDeleteAdmins,
  canToggleAdminsStatus,
  admins,
  adminStats,
  loadingAdmins,
  deletingId,
  statusLoadingId,
  onOpenCreate,
  openEditModal,
  onToggleAdminStatus,
  onDeleteAdmin,
}: Props) {
  if (!canViewAdmins) return null;

  return (
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
              Invite admins, update permissions, control account status, and
              remove accounts from the database.
            </p>
          </div>

          {canCreateAdmins ? (
            <Button type="button" onClick={onOpenCreate}>
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
              <th className="px-5 py-4 text-right font-medium">Actions</th>
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
                const canDelete = canDeleteAdmins && a.role !== "superadmin";
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

                    <td className="px-5 py-4 text-[#a7aec4]">{a.email}</td>

                    <td className="px-5 py-4">
                      <Pill tone={a.role === "superadmin" ? "blue" : "neutral"}>
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
                            {deletingId === a._id ? "Deleting..." : "Delete"}
                          </Button>
                        ) : null}

                        {!canEdit && !canStatus && !canDelete ? (
                          <span className="text-[13px] text-[#7f879f]">—</span>
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
        Superadmin accounts are protected. Only normal admin accounts can be
        edited, deactivated, or permanently deleted from here.
      </div>
    </section>
  );
}