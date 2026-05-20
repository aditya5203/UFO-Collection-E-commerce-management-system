"use client";

import { API_URL } from "@/lib/api";

import * as React from "react";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/layout/CartHeader";
import MainFooter from "@/components/layout/MainFooter";
import { useI18n } from "@/lib/i18n/I18nProvider";

import DeleteAccountModal from "./_components/DeleteAccountModal";
import ProfileContent from "./_components/ProfileContent";
import ProfileHeader from "./_components/ProfileHeader";
import ProfileSidebar from "./_components/ProfileSidebar";
import ProfileToast from "./_components/ProfileToast";
import {
  containerClass,
  panelClass,
  ProfileFormState,
  shellClass,
  SidebarItem,
  ToastType,
  toOptionalNumber,
} from "./_components/profileTypes";

const API =
  API_URL;

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

  const [form, setForm] = React.useState<ProfileFormState>({
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
    },
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((p) => ({
      ...p,
      [name]: value,
    }));
  };

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

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeleteText("");
  };

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

      <ProfileToast toast={toast} onClose={() => setToast(null)} />

      <main className={shellClass}>
        <div className={containerClass}>
          <ProfileHeader
            title={t("profile.title")}
            backLabel={t("profile.back")}
            onBack={() => router.back()}
          />

          <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
            <ProfileSidebar
              form={form}
              sidebarItems={sidebarItems}
              loggingOut={loggingOut}
              deleting={deleting}
              logoutLabel={t("profile.logout")}
              loggingOutLabel={t("profile.loggingOut")}
              onLogout={handleLogout}
            />

            <ProfileContent
              form={form}
              saving={saving}
              deleting={deleting}
              loggingOut={loggingOut}
              labels={{
                personalInfo: t("profile.personalInfo"),
                name: t("profile.name"),
                email: t("profile.email"),
                save: t("profile.save"),
                saving: t("profile.saving"),
                fitPreferences: t("profile.fitPreferences"),
                height: t("profile.height"),
                weight: t("profile.weight"),
                sizeRec: t("profile.sizeRec"),
                menSize: t("profile.menSize"),
                womenSize: t("profile.womenSize"),
                ticketsTitle: t("profile.ticketsTitle"),
                ticketsDesc: t("profile.ticketsDesc"),
                raiseTitle: t("profile.raiseTitle"),
                raiseDesc: t("profile.raiseDesc"),
                dangerZone: t("profile.dangerZone"),
                dangerDesc: t("profile.dangerDesc"),
                deleteBtn: t("profile.deleteBtn"),
              }}
              onChange={handleChange}
              onSubmit={handleSave}
              onOpenDelete={() => {
                setDeleteOpen(true);
                setDeleteText("");
              }}
            />
          </div>
        </div>

        <DeleteAccountModal
          open={deleteOpen}
          deleting={deleting}
          deleteText={deleteText}
          inputRef={deleteInputRef}
          labels={{
            title: t("profile.deleteModalTitle"),
            hint: t("profile.deleteModalHint"),
            close: t("profile.close"),
            typeDelete: t("profile.typeDelete"),
            cancel: t("profile.cancel"),
            confirmDelete: t("profile.confirmDelete"),
          }}
          onTextChange={setDeleteText}
          onClose={closeDeleteModal}
          onConfirm={doDeleteAccount}
        />
      </main>

      <MainFooter />
    </>
  );
}