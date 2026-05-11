"use client";

import * as React from "react";
import {
  ADMIN_PERMISSION_GROUPS,
  AdminPermissionKey,
  AdminPermissions,
} from "../../_components/adminPermissions";
import { inputClass } from "./settingsTypes";
import {
  Button,
  ErrBox,
  Field,
  Input,
  Modal,
  PermissionGroups,
} from "./SettingsShared";

type BaseProps = {
  mode: "create" | "edit";
  open: boolean;
  onClose: () => void;
  error: string;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  permissions: AdminPermissions;
  onTogglePermission: (key: AdminPermissionKey) => void;
  loading: boolean;
  onSubmit: () => void;
};

type CreateProps = BaseProps & {
  mode: "create";
};

type EditProps = BaseProps & {
  mode: "edit";
  status: "active" | "inactive" | "invited";
  setStatus: (value: "active" | "inactive" | "invited") => void;
};

type Props = CreateProps | EditProps;

export default function AdminFormModal(props: Props) {
  const isEdit = props.mode === "edit";

  return (
    <Modal
      open={props.open}
      title={isEdit ? "Edit Admin" : "Invite Admin"}
      subtitle={
        isEdit
          ? "Update admin details, status, and module permissions."
          : "Create an admin invitation and assign action-based permissions."
      }
      onClose={props.onClose}
    >
      <div className="space-y-6">
        {props.error ? <ErrBox text={props.error} /> : null}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Full Name"
            htmlFor={isEdit ? "editAdminName" : "createAdminName"}
          >
            <Input
              id={isEdit ? "editAdminName" : "createAdminName"}
              name={isEdit ? "editAdminName" : "createAdminName"}
              title="Admin name"
              value={props.name}
              onChange={(e) => props.setName(e.target.value)}
              placeholder="Admin name"
            />
          </Field>

          <Field
            label="Email"
            htmlFor={isEdit ? "editAdminEmail" : "createAdminEmail"}
          >
            <Input
              id={isEdit ? "editAdminEmail" : "createAdminEmail"}
              name={isEdit ? "editAdminEmail" : "createAdminEmail"}
              title="Admin email"
              type="email"
              value={props.email}
              onChange={(e) => props.setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </Field>
        </div>

        {isEdit ? (
          <Field label="Status" htmlFor="editAdminStatus">
            <select
              id="editAdminStatus"
              name="editAdminStatus"
              title="Admin status"
              aria-label="Admin status"
              value={props.status}
              onChange={(e) =>
                props.setStatus(
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
        ) : null}

        <PermissionGroups
          permissions={props.permissions}
          onToggle={props.onTogglePermission}
          groups={ADMIN_PERMISSION_GROUPS}
        />

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#26293a] bg-[#11121a] pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={props.onClose}
            disabled={props.loading}
          >
            Cancel
          </Button>

          <Button type="button" onClick={props.onSubmit} disabled={props.loading}>
            {props.loading
              ? isEdit
                ? "Updating..."
                : "Sending..."
              : isEdit
                ? "Update Admin"
                : "Send Invite"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}