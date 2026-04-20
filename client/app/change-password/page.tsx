"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ChangePasswordPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  const [form, setForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.currentPassword.trim()) {
      alert("Current password is required");
      return;
    }

    if (!form.newPassword.trim()) {
      alert("New password is required");
      return;
    }

    if (form.newPassword.length < 6) {
      alert("New password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${API}/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.message || "Failed to change password");
        return;
      }

      alert("Password changed successfully");
      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050611] text-white">
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label="Back"
              title="Back"
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">Back</span>
            </button>

            <Link href="/homepage" className="flex items-center gap-2">
              <div className="h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-white">
                <Image
                  src="/images/logo.png"
                  alt="UFO Collection logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[26px] font-bold uppercase tracking-[0.18em] text-white">
                UFO Collection
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1160px] justify-center px-4 py-10">
        <div className="w-full max-w-[650px] rounded-xl border border-[#22253a] bg-[#101223] p-6">
          <h1 className="text-xl font-semibold">Change Password</h1>
          <p className="mt-2 text-sm text-[#8b90ad]">
            Update your account password securely.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label
              htmlFor="currentPassword"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Current Password
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-[#23253a] bg-[#181a2c]">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="px-3 text-[12px] text-[#8b90ad] hover:text-white"
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>

            <label
              htmlFor="newPassword"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              New Password
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-[#23253a] bg-[#181a2c]">
              <input
                id="newPassword"
                name="newPassword"
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="px-3 text-[12px] text-[#8b90ad] hover:text-white"
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>

            <label
              htmlFor="confirmPassword"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Confirm New Password
            </label>
            <div className="mt-1 flex items-center rounded-lg border border-[#23253a] bg-[#181a2c]">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="px-3 text-[12px] text-[#8b90ad] hover:text-white"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="rounded-full border border-[#23253a] px-6 py-3 text-sm text-white hover:bg-[#181a2c]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#2f7efc] px-6 py-3 text-sm hover:brightness-105 disabled:opacity-60"
              >
                {saving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}