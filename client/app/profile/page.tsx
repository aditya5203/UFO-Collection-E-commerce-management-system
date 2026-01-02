"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

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

  // -------------------------------
  // INPUT CHANGE
  // -------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // -------------------------------
  // LOAD PROFILE -> GET /auth/me
  // -------------------------------
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const api =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${api}/auth/me`, { credentials: "include" });

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
  }, [router]);

  // -------------------------------
  // SAVE PROFILE -> PATCH /auth/profile
  // -------------------------------
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const api =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

      const res = await fetch(`${api}/auth/profile`, {
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
        alert(data?.message || "Update failed");
        return;
      }

      setForm((p) => ({
        ...p,
        menSize: data.user?.recommendedSizeMen || "",
        womenSize: data.user?.recommendedSizeWomen || "",
      }));

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------
  // LOGOUT -> POST /auth/logout
  // -------------------------------
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const api =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

      await fetch(`${api}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      router.push("/login");
    }
  };

  // -------------------------------
  // CLOSE MENU ON OUTSIDE CLICK + ESC
  // -------------------------------
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuOpen) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
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
        Loading profile…
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#050611] text-white">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 border-b border-[#191b2d] bg-[rgba(5,6,17,0.96)] backdrop-blur-[12px]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1160px] items-center justify-between px-4">
          {/* LEFT: Back + Logo + Brand */}
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

          {/* CENTER NAV */}
          <nav className="hidden md:flex gap-10">
            <Link
              href="/homepage"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              HOME
            </Link>
            <Link
              href="/collection"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              COLLECTION
            </Link>
            <Link
              href="/about"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              ABOUT
            </Link>
            <Link
              href="/contact"
              className="text-[15px] uppercase tracking-[0.16em] text-[#8b90ad] hover:text-[#c9b9ff]"
            >
              CONTACT
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

            {/* ✅ PROFILE INITIALS ICON */}
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
              <div className="absolute right-0 top-[56px] w-[220px] overflow-hidden rounded-[12px] border border-[#23253a] bg-[#101223] shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
                <Link
                  href="/order-tracking"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  Order Tracking
                </Link>

                <Link
                  href="/order-history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  Order History
                </Link>

                <Link
                  href="/address"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-[13px] text-white hover:bg-[#15182a]"
                >
                  Address
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/language");
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] text-white hover:bg-[#15182a]"
                >
                  Language
                </button>

                <div className="h-px bg-[#23253a]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loggingOut}
                  className="w-full px-4 py-3 text-left text-[13px] text-red-300 hover:bg-[#15182a] disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-[1160px] px-4 py-10 flex justify-center">
        <div className="w-full max-w-[650px] rounded-xl border border-[#22253a] bg-[#101223] p-6">
          <h1 className="text-xl font-semibold">My Profile</h1>

          <form onSubmit={handleSave} className="mt-6">
            <p className="text-[13px] font-semibold text-[#8b90ad]">
              Personal Information
            </p>

            <label
              htmlFor="name"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none focus:ring-1 focus:ring-[#c9b9ff]"
            />

            <label
              htmlFor="email"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Email
            </label>
            <input
              id="email"
              value={form.email}
              readOnly
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white opacity-70"
            />

            <p className="mt-6 text-[13px] font-semibold text-[#8b90ad]">
              Fit Preferences
            </p>

            <label
              htmlFor="height"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Height (ft)
            </label>
            <input
              id="height"
              name="height"
              value={form.height}
              onChange={handleChange}
              placeholder="e.g. 5.6"
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white placeholder:text-[#787e99] focus:outline-none focus:ring-1 focus:ring-[#c9b9ff]"
            />

            <label
              htmlFor="weight"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Weight (kg)
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
              Size Recommendation
            </p>

            <label
              htmlFor="menSize"
              className="mt-3 block text-[12px] text-[#8b90ad]"
            >
              Men&apos;s Size
            </label>
            <input
              id="menSize"
              value={form.menSize || "-"}
              readOnly
              className="mt-1 w-full rounded-lg border border-[#23253a] bg-[#181a2c] px-3 py-3 text-sm text-white opacity-70"
            />

            <label
              htmlFor="womenSize"
              className="mt-4 block text-[12px] text-[#8b90ad]"
            >
              Women&apos;s Size
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
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full bg-red-500 px-6 py-3 text-sm hover:bg-red-600 disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
