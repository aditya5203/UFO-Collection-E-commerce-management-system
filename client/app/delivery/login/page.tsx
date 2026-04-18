"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DELIVERY_ENDPOINTS, safeJson } from "@/app/lib/delivery";

type LoginForm = {
  emailOrPhone: string;
  password: string;
};

function inputClassName() {
  return "w-full rounded-[14px] border border-[#111827] bg-[#020617] px-5 py-4 text-sm text-white placeholder:text-[#6b7280] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
}

export default function DeliveryLoginPage() {
  const router = useRouter();

  const [form, setForm] = React.useState<LoginForm>({
    emailOrPhone: "",
    password: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const updateField = <K extends keyof LoginForm>(key: K, value: LoginForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.emailOrPhone.trim()) return "Email or phone is required.";
    if (!form.password.trim()) return "Password is required.";
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(DELIVERY_ENDPOINTS.login, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone: form.emailOrPhone.trim(),
          password: form.password.trim(),
        }),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json as any)?.message || "Login failed");
        return;
      }

      const mustChangePassword =
        Boolean((json as any)?.mustChangePassword) ||
        Boolean((json as any)?.user?.mustChangePassword) ||
        Boolean((json as any)?.data?.mustChangePassword);

      if (mustChangePassword) {
        router.replace("/delivery/change-password");
        return;
      }

      router.replace("/delivery/dashboard");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03101f] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px] gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-[290px] shrink-0 rounded-[20px] border border-[#111827] bg-[#020617] p-6 lg:flex lg:flex-col">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6b7280]">
            UFO Collection
          </div>
          <h2 className="mt-4 text-[20px] font-extrabold text-white">
            Delivery Panel
          </h2>

          <div className="mt-10 space-y-4 text-[#d1d5db]">
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] px-4 py-4">
              Dashboard
            </div>
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] px-4 py-4">
              My Orders
            </div>
            <div className="rounded-[14px] border border-[#111827] bg-[#0b1220] px-4 py-4">
              Profile
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden rounded-[20px] border border-[#111827] bg-[#020617] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="border-b border-[#111827] px-4 py-4 md:px-6 lg:px-8">
            <h1 className="text-[18px] font-bold text-white md:text-[20px]">
              Delivery Panel
            </h1>
          </div>

          <div className="grid min-h-[calc(100vh-110px)] place-items-center px-4 py-10 md:px-6">
            <section className="w-full max-w-[560px]">
              <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Delivery Login
                </h2>
              </div>

              {error ? (
                <div className="mt-6 rounded-[14px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="mt-8 space-y-6">
                <input
                  type="text"
                  value={form.emailOrPhone}
                  onChange={(e) => updateField("emailOrPhone", e.target.value)}
                  placeholder="Email Address or Phone"
                  className={inputClassName()}
                />

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Password"
                  className={inputClassName()}
                />

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-w-[150px] rounded-[14px] bg-[#2563eb] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Login"}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/"
                  className="text-sm font-semibold text-[#60a5fa] transition hover:text-[#93c5fd]"
                >
                  Back to store
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}