"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"; // ✅ base only (no /api)

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ MUST so adminToken cookie stores
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid admin credentials");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "#070514",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Topbar (same UI/colors) */}
      <header className="flex h-16 items-center border-b border-[#2a223b] bg-[#0b061b] px-[40px]">
        <div className="text-[18px] font-semibold">Admin Panel</div>
      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-[40px]">
        <div className="flex w-full max-w-[460px] flex-col items-center rounded-[16px]">
          <h1 className="mb-8 text-center text-[26px] font-semibold">
            Admin Login
          </h1>

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[18px]">
            <div className="flex flex-col">
              <input
                className="w-full rounded-[10px] border border-[#3a2b58] bg-[#160d28] px-[16px] py-[14px] text-[14px] text-[#f5f3ff] outline-none placeholder:text-[#7f6caa] focus:border-[#a95cff] focus:shadow-[0_0_0_1px_rgba(169,92,255,0.4)]"
                type="email"
                name="email"
                placeholder="Email Address"
                required
              />
            </div>

            <div className="flex flex-col">
              <input
                className="w-full rounded-[10px] border border-[#3a2b58] bg-[#160d28] px-[16px] py-[14px] text-[14px] text-[#f5f3ff] outline-none placeholder:text-[#7f6caa] focus:border-[#a95cff] focus:shadow-[0_0_0_1px_rgba(169,92,255,0.4)]"
                type="password"
                name="password"
                placeholder="Password"
                required
              />
            </div>

            {error && (
              <div className="-mt-[6px] text-center text-[13px] text-[#ff6b81]">
                {error}
              </div>
            )}

            <div className="mt-[6px] flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer rounded-full border-none px-[40px] py-[12px] text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(176,33,255,0.4)] transition-[transform,box-shadow,opacity] duration-[120ms] ease-in hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(176,33,255,0.55)] active:translate-y-0 active:shadow-[0_6px_18px_rgba(176,33,255,0.35)] disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #b021ff, #5b1dff)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
