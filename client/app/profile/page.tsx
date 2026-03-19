"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

// ✅ INITIALS LOGIC (Aditya Kumar => AK)
function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";

  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";

  return (first + last).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // ✅ delete account
  const [deleting, setDeleting] = React.useState(false);

  // ✅ delete modal
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState("");

  // 3-dots dropdown
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    height: "",
    weight: "",
    menSize: "",
    womenSize: "",
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  // INPUT CHANGE
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // LOAD PROFILE -> GET /auth/me
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: "include" });

        if (res.status === 401 || !res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json().catch(() => ({} as any));
        const u = data?.user;

        if (!u) {
          router.push("/login");
          return;
        }

        setForm({
          name: u.name || "",
          email: u.email || "",
          height: u.height ? String(u.height) : "",
          weight: u.weight ? String(u.weight) : "",
          menSize: u.recommendedSizeMen || "",
          womenSize: u.recommendedSizeWomen || "",
        });
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [API, router]);

  // SAVE PROFILE -> PATCH /auth/profile
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          height: form.height ? Number(form.height) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.message || t("profile.updateFail"));
        return;
      }

      setForm((p) => ({
        ...p,
        menSize: data.user?.recommendedSizeMen || "",
        womenSize: data.user?.recommendedSizeWomen || "",
      }));

      alert(t("profile.updatedOk"));
    } catch (err) {
      console.error(err);
      alert(t("profile.tryAgain"));
    } finally {
      setSaving(false);
    }
  };

  // LOGOUT -> POST /auth/logout
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      router.push("/login");
    }
  };

  // ✅ DELETE ACCOUNT -> DELETE /auth/account
  const doDeleteAccount = async () => {
    if (deleting) return;

    if (deleteText.trim().toUpperCase() !== "DELETE") {
      alert(t("profile.mustTypeDelete"));
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`${API}/auth/account`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.message || t("profile.deleteFail"));
        return;
      }

      alert(t("profile.deletedOk"));
      setDeleteOpen(false);
      router.push("/signup");
    } catch (err) {
      console.error(err);
      alert(t("profile.tryAgain"));
    } finally {
      setDeleting(false);
      setDeleteText("");
    }
  };

  // CLOSE MENU ON OUTSIDE CLICK + ESC
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDeleteOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050611] text-white flex items-center justify-center">
        {t("profile.loading")}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#050611] text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 rounded-full border border-[#2b2f45] px-3 py-[7px] text-[11px] uppercase tracking-[0.16em] text-white hover:bg-white hover:text-[#050611]"
              aria-label={t("profile.back")}
              title={t("profile.back")}
            >
              <Image
                src="/images/backarrow.png"
                width={18}
                height={18}
                alt="Back icon"
                className="brightness-0 invert group-hover:invert-0"
              />
              <span className="hidden sm:inline">{t("profile.back")}</span>
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

          {/* CENTER NAV */}
          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              {t("nav.collection")}
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              {t("nav.about")}
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              {t("nav.contact")}
            </Link>
          </nav>

          {/* RIGHT */}
          <div className="relative flex items-center gap-2" ref={menuRef}>
            <Link href="/wishlist" aria-label="Wishlist" title="Wishlist">
              <Image
                src="/images/wishlist.png"
                width={26}
                height={26}
                alt="Wishlist icon"
                className="brightness-0 invert"
              />
            </Link>

            {/* Profile initials */}
            <button
              type="button"
              aria-label="Profile"
              title={form.name || "Profile"}
              className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#2b2f45] bg-white text-[12px] font-semibold text-[#050611] hover:brightness-95"
              onClick={() => router.push("/profile")}
            >
              {getInitials(form.name || form.email)}
            </button>

            <button
              type="button"
              aria-label="Menu"
              title="Menu"
              className="rounded-full border border-[#2b2f45] p-2 hover:bg-white/10"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Image
                src="/images/dots.png"
                width={24}
                height={24}
                alt="Menu"
                className="brightness-0 invert"
              />
            </button>

            {/* Dropdown */}
            {menuOpen ? (
              <div className="absolute right-0 top-[56px] w-[240px] overflow-hidden rounded-[12px] border border-[#23253a] bg-[#101223] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <Link
                  href="/order-tracking"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.orderTracking")}
                </Link>

                <Link
                  href="/order-history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.orderHistory")}
                </Link>

                <Link
                  href="/address"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.address")}
                </Link>

                <Link
                  href="/live-agent-chat"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.liveChat")}
                </Link>

                <Link
                  href="/profile/tickets"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.myTickets")}
                </Link>

                <Link
                  href="/support-ticket"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.raiseTicket")}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/language");
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] text-white hover:bg-[#15182a]"
                >
                  {t("nav.language")}
                </button>

                <div className="h-px bg-[#23253a]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                    setDeleteText("");
                  }}
                  disabled={loggingOut || deleting}
                  className="w-full px-4 py-3 text-left text-[13px] text-red-200 hover:bg-[#15182a] disabled:opacity-60"
                >
                  {t("nav.deleteAccount")}
                </button>

                <div className="h-px bg-[#23253a]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loggingOut || deleting}
                  className="w-full px-4 py-3 text-left text-[13px] text-red-300 hover:bg-[#15182a] disabled:opacity-60"
                >
                  {loggingOut ? t("profile.loggingOut") : t("nav.logout")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-[1160px] px-4 py-10 flex justify-center">
        <div className="w-full max-w-[650px] rounded-xl border border-[#22253a] bg-[#101223] p-6">
          <h1 className="text-xl font-semibold">{t("profile.title")}</h1>

          <form onSubmit={handleSave} className="mt-6">
            <p className="text-[13px] font-semibold text-[#8b90ad]">
              {t("profile.personalInfo")}
            </p>

            <label htmlFor="name" className="mt-4 block text-[12px] text-[#8b90ad]">
              {t("profile.name")}
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("profile.name")}
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none focus:ring-1 focus:ring-[#c9b9ff]"
            />

            <label htmlFor="email" className="mt-4 block text-[12px] text-[#8b90ad]">
              {t("profile.email")}
            </label>
            <input
              id="email"
              value={form.email}
              readOnly
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white opacity-70"
            />

            <p className="mt-6 text-[13px] font-semibold text-[#8b90ad]">
              {t("profile.fitPreferences")}
            </p>

            <label htmlFor="height" className="mt-4 block text-[12px] text-[#8b90ad]">
              {t("profile.height")}
            </label>
            <input
              id="height"
              name="height"
              value={form.height}
              onChange={handleChange}
              placeholder="e.g. 5.6"
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none focus:ring-1 focus:ring-[#c9b9ff]"
            />

            <label htmlFor="weight" className="mt-4 block text-[12px] text-[#8b90ad]">
              {t("profile.weight")}
            </label>
            <input
              id="weight"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="e.g. 60"
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none focus:ring-1 focus:ring-[#c9b9ff]"
            />

            <p className="mt-6 text-[13px] font-semibold text-[#8b90ad]">
              {t("profile.sizeRec")}
            </p>

            <label htmlFor="menSize" className="mt-3 block text-[12px] text-[#8b90ad]">
              {t("profile.menSize")}
            </label>
            <input
              id="menSize"
              value={form.menSize || "-"}
              readOnly
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white opacity-70"
            />

            <label htmlFor="womenSize" className="mt-4 block text-[12px] text-[#8b90ad]">
              {t("profile.womenSize")}
            </label>
            <input
              id="womenSize"
              value={form.womenSize || "-"}
              readOnly
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white opacity-70"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#2f7efc] px-6 py-3 text-sm hover:brightness-105 disabled:opacity-60"
              >
                {saving ? t("profile.saving") : t("profile.save")}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut || deleting}
                className="rounded-full bg-red-500 px-6 py-3 text-sm hover:bg-red-600 disabled:opacity-60"
              >
                {loggingOut ? t("profile.loggingOut") : t("profile.logout")}
              </button>
            </div>

            {/* quick links */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/profile/tickets"
                className="rounded-xl border border-[#23253a] bg-[#0c0e1c] px-4 py-4 text-sm hover:bg-[#12142a]"
              >
                <div className="font-semibold text-white">{t("profile.ticketsTitle")}</div>
                <div className="mt-1 text-[#8b90ad] text-[12px]">{t("profile.ticketsDesc")}</div>
              </Link>

              <Link
                href="/support-ticket"
                className="rounded-xl border border-[#23253a] bg-[#0c0e1c] px-4 py-4 text-sm hover:bg-[#12142a]"
              >
                <div className="font-semibold text-white">{t("profile.raiseTitle")}</div>
                <div className="mt-1 text-[#8b90ad] text-[12px]">{t("profile.raiseDesc")}</div>
              </Link>
            </div>

            {/* DELETE SECTION */}
            <div className="mt-10 rounded-xl border border-[#3a1f24] bg-[#12070a] p-4">
              <div className="text-sm font-semibold text-red-200">{t("profile.dangerZone")}</div>
              <div className="mt-1 text-[12px] text-[#c6a3aa]">{t("profile.dangerDesc")}</div>

              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(true);
                  setDeleteText("");
                }}
                disabled={deleting || loggingOut}
                className="mt-4 rounded-full bg-red-500 px-6 py-3 text-sm hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? t("profile.confirmDelete") : t("profile.deleteBtn")}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* DELETE MODAL */}
      {deleteOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[520px] rounded-2xl border border-[#2b2f45] bg-[#0b0d1b] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {t("profile.deleteModalTitle")}
                </h3>
                <p className="mt-1 text-[12px] text-[#8b90ad]">
                  {t("profile.deleteModalHint")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteText("");
                }}
                className="rounded-full border border-[#23253a] px-3 py-1 text-[12px] text-[#cbd0ea] hover:bg-white/10"
              >
                {t("profile.close")}
              </button>
            </div>

            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder={t("profile.typeDelete")}
              className="mt-4 w-full rounded-lg border border-[#23253a] bg-[#12142a] px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none focus:ring-1 focus:ring-red-400"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteText("");
                }}
                disabled={deleting}
                className="rounded-full border border-[#23253a] bg-transparent px-5 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
              >
                {t("profile.cancel")}
              </button>

              <button
                type="button"
                onClick={doDeleteAccount}
                disabled={deleting}
                className="rounded-full bg-red-500 px-6 py-2 text-sm hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? t("profile.confirmDelete") : t("profile.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}