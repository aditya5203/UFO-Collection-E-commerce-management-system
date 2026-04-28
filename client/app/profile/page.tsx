"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";
import { useI18n } from "@/lib/i18n/I18nProvider";

type ToastType = "success" | "error" | "info";

type SidebarItem = {
  label: string;
  href: string;
  icon: string;
};

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080/api";

const shellClass = "min-h-[calc(100vh-76px)] bg-[#0a0a0f] text-[#f5f7fb]";
const containerClass =
  "mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-5 sm:py-10 lg:px-6";
const panelClass =
  "rounded-[24px] border border-[#26293a] bg-[#11121a] shadow-[0_20px_70px_rgba(0,0,0,0.35)]";
const primaryBtnClass =
  "rounded-full bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#090a12] transition hover:-translate-y-0.5 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const secondaryBtnClass =
  "rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

function getInitials(name: string) {
  const clean = (name || "").trim();
  if (!clean) return "U";

  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last =
    parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : parts[0]?.[1] ?? "";

  return (first + last).toUpperCase();
}

function toOptionalNumber(value: string) {
  const clean = value.trim();
  if (!clean) return undefined;

  const num = Number(clean);
  return Number.isFinite(num) ? num : undefined;
}

function ToastMessage({
  toast,
  onClose,
}: {
  toast: { type: ToastType; message: string } | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const tone =
    toast.type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-100"
      : toast.type === "info"
        ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
        : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";

  const dot =
    toast.type === "error"
      ? "bg-red-300"
      : toast.type === "info"
        ? "bg-blue-300"
        : "bg-emerald-300";

  return (
    <div className="fixed right-4 top-24 z-[100] w-[calc(100%-32px)] max-w-[380px] sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl ${tone}`}
      >
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dot}`} />

        <div className="flex-1 text-[13px] font-medium leading-6">
          {toast.message}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 text-[14px] text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
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
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a7aec4]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SidebarLink({ item }: { item: SidebarItem }) {
  return (
    <Link
      href={item.href}
      className="group flex items-center justify-between rounded-[18px] border border-[#26293a] bg-[#161824] px-4 py-3.5 text-sm text-white transition duration-300 hover:-translate-y-0.5 hover:border-[#d6c7ff]/40 hover:bg-white/[0.07] hover:shadow-[0_14px_40px_rgba(0,0,0,0.28)]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition group-hover:border-[#d6c7ff]/40 group-hover:bg-[#d6c7ff]/10">
          <Image
            src={item.icon}
            alt={`${item.label} icon`}
            width={18}
            height={18}
            className="h-[18px] w-[18px] object-contain brightness-0 invert"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </span>

        <span className="truncate font-semibold">{item.label}</span>
      </span>

      <span className="ml-3 shrink-0 text-[#a7aec4] transition group-hover:translate-x-1 group-hover:text-[#d6c7ff]">
        →
      </span>
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteText, setDeleteText] = React.useState("");

  const [toast, setToast] = React.useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const redirectTimerRef = React.useRef<number | null>(null);
  const deleteInputRef = React.useRef<HTMLInputElement | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    height: "",
    weight: "",
    menSize: "",
    womenSize: "",
  });

  const sidebarItems: SidebarItem[] = [
    {
  label: t("nav.orderTracking"),
  href: "/order-tracking?from=profile",
  icon: "/images/order-tracking.png",
    } ,

    {
      label: t("nav.orderHistory"),
      href: "/order-history",
      icon: "/images/order-history.png",
    },
    {
      label: t("nav.address"),
      href: "/address",
      icon: "/images/address.png",
    },
    {
      label: t("nav.liveChat"),
      href: "/live-agent-chat",
      icon: "/images/live-chat.png",
    },
    {
      label: t("nav.myTickets"),
      href: "/profile/tickets",
      icon: "/images/ticket.png",
    },
    {
      label: t("nav.raiseTicket"),
      href: "/support-ticket",
      icon: "/images/support.png",
    },
    {
      label: t("nav.language"),
      href: "/language",
      icon: "/images/language.png",
    },
    {
      label: "Change Password",
      href: "/change-password",
      icon: "/images/password.png",
    },
  ];

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2600);
    },
    []
  );

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!deleteOpen) return;

    const timer = window.setTimeout(() => {
      deleteInputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [deleteOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((p) => ({
      ...p,
      [name]: value,
    }));
  };

  React.useEffect(() => {
    let alive = true;

    const loadProfile = async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!alive) return;

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
          phone: u.phone || "",
          height: u.height ? String(u.height) : "",
          weight: u.weight ? String(u.weight) : "",
          menSize: u.recommendedSizeMen || "",
          womenSize: u.recommendedSizeWomen || "",
        });
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      alive = false;
    };
  }, [router]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanName = form.name.trim();
    const cleanPhone = form.phone.trim();
    const heightNumber = toOptionalNumber(form.height);
    const weightNumber = toOptionalNumber(form.weight);

    if (!cleanName) {
      showToast("Name is required.", "error");
      return;
    }

    if (cleanPhone && !/^[0-9+\-\s()]{7,20}$/.test(cleanPhone)) {
      showToast("Please enter a valid mobile number.", "error");
      return;
    }

    if (form.height.trim() && (!heightNumber || heightNumber <= 0)) {
      showToast("Please enter a valid height.", "error");
      return;
    }

    if (form.weight.trim() && (!weightNumber || weightNumber <= 0)) {
      showToast("Please enter a valid weight.", "error");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          height: heightNumber,
          weight: weightNumber,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        showToast(data?.message || t("profile.updateFail"), "error");
        return;
      }

      setForm((p) => ({
        ...p,
        name: data.user?.name || cleanName,
        phone: data.user?.phone || cleanPhone,
        menSize: data.user?.recommendedSizeMen || "",
        womenSize: data.user?.recommendedSizeWomen || "",
      }));

      showToast(t("profile.updatedOk"), "success");
    } catch (err) {
      console.error(err);
      showToast(t("profile.tryAgain"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut || deleting) return;

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

  const doDeleteAccount = async () => {
    if (deleting) return;

    if (deleteText.trim().toUpperCase() !== "DELETE") {
      showToast(t("profile.mustTypeDelete"), "error");
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
        showToast(data?.message || t("profile.deleteFail"), "error");
        return;
      }

      setDeleteOpen(false);
      setDeleteText("");
      showToast(t("profile.deletedOk"), "success");

      redirectTimerRef.current = window.setTimeout(() => {
        router.push("/signup");
      }, 900);
    } catch (err) {
      console.error(err);
      showToast(t("profile.tryAgain"), "error");
    } finally {
      setDeleting(false);
    }
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        setDeleteOpen(false);
        setDeleteText("");
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deleting]);

  if (loading) {
    return (
      <>
        <CartHeader />

        <main className={shellClass}>
          <div className={containerClass}>
            <div className="mb-8">
              <div className="h-3 w-36 animate-pulse rounded bg-white/5" />
              <div className="mt-4 h-12 w-72 animate-pulse rounded bg-white/5" />
              <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/5" />
            </div>

            <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className={`${panelClass} p-6`}>
                <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-white/5" />
                <div className="mx-auto mt-5 h-5 w-40 animate-pulse rounded bg-white/5" />
                <div className="mx-auto mt-3 h-4 w-56 animate-pulse rounded bg-white/5" />
              </div>

              <div className={`${panelClass} p-6`}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="mb-5">
                    <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
                    <div className="mt-2 h-12 w-full animate-pulse rounded bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <MainFooter />
      </>
    );
  }

  return (
    <>
      <CartHeader />

      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                Account Center
              </div>

              <h1 className="mt-2 text-[32px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
                {t("profile.title")}
              </h1>

              <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-[#a7aec4]">
                Manage your personal information, mobile number, fit
                preferences, support tickets, and account security.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className={secondaryBtnClass}
            >
              {t("profile.back")}
            </button>
          </div>

          <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
            <aside
              className={`${panelClass} overflow-hidden lg:sticky lg:top-[104px]`}
            >
              <div className="relative min-h-[170px] border-b border-[#26293a] bg-[radial-gradient(circle_at_top,#30214f,transparent_55%),linear-gradient(135deg,#161824,#0d0f17)] p-6">
                <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#d6c7ff]">
                  Customer
                </div>

                <div className="mt-10 flex items-center gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white text-[28px] font-bold tracking-[-0.04em] text-[#090a12] shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                    {getInitials(form.name || form.email)}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[22px] font-semibold tracking-[-0.03em] text-white">
                      {form.name || "UFO User"}
                    </div>

                    <div className="mt-1 truncate text-[13px] text-[#a7aec4]">
                      {form.email}
                    </div>

                    {form.phone ? (
                      <div className="mt-1 truncate text-[12px] text-[#d6c7ff]">
                        {form.phone}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a7aec4]">
                  Quick Menu
                </div>

                <div className="grid gap-3">
                  {sidebarItems.map((item) => (
                    <SidebarLink key={item.href} item={item} />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut || deleting}
                  className="mt-5 flex w-full items-center justify-between rounded-[18px] border border-red-400/30 bg-red-500/10 px-4 py-3.5 text-sm font-semibold text-red-100 transition duration-300 hover:-translate-y-0.5 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10">
                      <Image
                        src="/images/logout.png"
                        alt="Logout icon"
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] object-contain brightness-0 invert"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </span>

                    <span>
                      {loggingOut
                        ? t("profile.loggingOut")
                        : t("profile.logout")}
                    </span>
                  </span>

                  <span className="text-red-200">→</span>
                </button>
              </div>
            </aside>

            <section className="grid gap-8">
              <form onSubmit={handleSave} className={`${panelClass} p-5 sm:p-6`}>
                <div className="flex flex-col gap-3 border-b border-[#26293a] pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                      Profile Details
                    </div>

                    <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                      {t("profile.personalInfo")}
                    </h2>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || deleting || loggingOut}
                    className={primaryBtnClass}
                  >
                    {saving ? t("profile.saving") : t("profile.save")}
                  </button>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label={t("profile.name")} htmlFor="name">
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={t("profile.name")}
                      aria-label="Name"
                      autoComplete="name"
                      className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                    />
                  </Field>

                  <Field label={t("profile.email")} htmlFor="email">
                    <input
                      id="email"
                      name="email"
                      value={form.email}
                      readOnly
                      placeholder={t("profile.email")}
                      aria-label="Email"
                      title="Email cannot be changed"
                      autoComplete="email"
                      className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#a7aec4] outline-none opacity-80"
                    />
                  </Field>

                  <Field label="Mobile Number" htmlFor="phone">
                    <input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9842690683"
                      aria-label="Mobile Number"
                      autoComplete="tel"
                      inputMode="tel"
                      className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                    />
                  </Field>
                </div>

                <div className="mt-8 border-t border-[#26293a] pt-6">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    {t("profile.fitPreferences")}
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <Field label={t("profile.height")} htmlFor="height">
                      <input
                        id="height"
                        name="height"
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={form.height}
                        onChange={handleChange}
                        placeholder="e.g. 5.6"
                        aria-label="Height"
                        className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                      />
                    </Field>

                    <Field label={t("profile.weight")} htmlFor="weight">
                      <input
                        id="weight"
                        name="weight"
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        value={form.weight}
                        onChange={handleChange}
                        placeholder="e.g. 60"
                        aria-label="Weight"
                        className="h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-[#f5f7fb] outline-none placeholder:text-[#7f879f] transition focus:border-[#d6c7ff]"
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-8 rounded-[20px] border border-[#26293a] bg-[#161824] p-4 sm:p-5">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                    {t("profile.sizeRec")}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        {t("profile.menSize")}
                      </div>

                      <div className="mt-2 text-[30px] font-semibold text-[#d6c7ff]">
                        {form.menSize || "-"}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-[#a7aec4]">
                        {t("profile.womenSize")}
                      </div>

                      <div className="mt-2 text-[30px] font-semibold text-[#d6c7ff]">
                        {form.womenSize || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[#a7aec4]">
                  Support
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Help & Tickets
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/profile/tickets"
                    className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b]"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Image
                        src="/images/ticket.png"
                        alt="Ticket icon"
                        width={22}
                        height={22}
                        className="object-contain brightness-0 invert"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="text-[16px] font-semibold text-white">
                      {t("profile.ticketsTitle")}
                    </div>

                    <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                      {t("profile.ticketsDesc")}
                    </div>
                  </Link>

                  <Link
                    href="/support-ticket"
                    className="rounded-[20px] border border-[#26293a] bg-[#161824] p-5 transition hover:-translate-y-1 hover:border-[#4a506b]"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Image
                        src="/images/support.png"
                        alt="Support icon"
                        width={22}
                        height={22}
                        className="object-contain brightness-0 invert"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="text-[16px] font-semibold text-white">
                      {t("profile.raiseTitle")}
                    </div>

                    <div className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                      {t("profile.raiseDesc")}
                    </div>
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] border border-red-400/25 bg-red-500/10 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-6">
                <div className="text-[11px] uppercase tracking-[0.24em] text-red-200">
                  {t("profile.dangerZone")}
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white">
                  Delete Account
                </h2>

                <p className="mt-2 max-w-[620px] text-[13px] leading-6 text-red-100/75">
                  {t("profile.dangerDesc")}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(true);
                    setDeleteText("");
                  }}
                  disabled={deleting || loggingOut}
                  className="mt-5 rounded-full border border-red-300/30 bg-red-500/20 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-red-100 transition hover:-translate-y-0.5 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {deleting ? "Deleting..." : t("profile.deleteBtn")}
                </button>
              </div>
            </section>
          </div>
        </div>

        {deleteOpen ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !deleting) {
                setDeleteOpen(false);
                setDeleteText("");
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="w-full max-w-[520px] rounded-[24px] border border-[#26293a] bg-[#11121a] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.75)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-red-200">
                    Confirm Action
                  </div>

                  <h3
                    id="delete-account-title"
                    className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-white"
                  >
                    {t("profile.deleteModalTitle")}
                  </h3>

                  <p className="mt-2 text-[13px] leading-6 text-[#a7aec4]">
                    {t("profile.deleteModalHint")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (deleting) return;
                    setDeleteOpen(false);
                    setDeleteText("");
                  }}
                  disabled={deleting}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t("profile.close")}
                </button>
              </div>

              <input
                ref={deleteInputRef}
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder={t("profile.typeDelete")}
                aria-label="Type DELETE to confirm account deletion"
                disabled={deleting}
                className="mt-5 h-[50px] w-full rounded-full border border-[#26293a] bg-[#0d0f17] px-5 text-[13px] text-white outline-none placeholder:text-[#7f879f] transition focus:border-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteText("");
                  }}
                  disabled={deleting}
                  className={secondaryBtnClass}
                >
                  {t("profile.cancel")}
                </button>

                <button
                  type="button"
                  onClick={doDeleteAccount}
                  disabled={deleting}
                  className="rounded-full bg-red-500 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {deleting ? "Deleting..." : t("profile.confirmDelete")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <MainFooter />
    </>
  );
}