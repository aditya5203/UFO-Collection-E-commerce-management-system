"use client";

import * as React from "react";
import { Button, ErrBox, Field, Input, Modal } from "./SettingsShared";

type Props = {
  open: boolean;
  onClose: () => void;
  passErr: string;
  oldPass: string;
  setOldPass: (value: string) => void;
  newPass: string;
  setNewPass: (value: string) => void;
  confirmPass: string;
  setConfirmPass: (value: string) => void;
  changing: boolean;
  onChangePassword: () => void;
};

export default function ChangePasswordModal({
  open,
  onClose,
  passErr,
  oldPass,
  setOldPass,
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  changing,
  onChangePassword,
}: Props) {
  return (
    <Modal
      open={open}
      title="Change Password"
      subtitle="Update your admin login password securely."
      onClose={onClose}
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
          <Button type="button" variant="ghost" onClick={onClose} disabled={changing}>
            Cancel
          </Button>

          <Button type="button" onClick={onChangePassword} disabled={changing}>
            {changing ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}