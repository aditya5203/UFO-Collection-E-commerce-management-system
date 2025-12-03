"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) return;

    try {
      setLoading(true);

      // Change this if your API base is different
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const res = await fetch(`${baseUrl}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // so backend can set httpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid admin credentials");
        return;
      }

      // Optional: you can store role/client info if needed
      // localStorage.setItem("ufo_admin", JSON.stringify(data.user));

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page styles only for this admin page */}
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #070514;
          color: #ffffff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .topbar {
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 40px;
          border-bottom: 1px solid #2a223b;
          background: #0b061b;
        }

        .topbar-title {
          font-size: 18px;
          font-weight: 600;
        }

        .main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }

        .card {
          width: 100%;
          max-width: 460px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .title {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 32px;
          text-align: center;
        }

        form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #3a2b58;
          background: #160d28;
          color: #f5f3ff;
          font-size: 14px;
          outline: none;
        }

        .input::placeholder {
          color: #7f6caa;
        }

        .input:focus {
          border-color: #a95cff;
          box-shadow: 0 0 0 1px rgba(169, 92, 255, 0.4);
        }

        .error {
          margin-top: -6px;
          font-size: 13px;
          color: #ff6b81;
          text-align: center;
        }

        .button-wrap {
          margin-top: 6px;
          display: flex;
          justify-content: center;
        }

        .btn {
          border: none;
          outline: none;
          padding: 12px 40px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          background: linear-gradient(135deg, #b021ff, #5b1dff);
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(176, 33, 255, 0.4);
          transition: transform 0.12s ease, box-shadow 0.12s ease,
            opacity 0.12s ease;
          opacity: ${loading ? 0.7 : 1};
        }

        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(176, 33, 255, 0.55);
        }

        .btn:active {
          transform: translateY(0);
          box-shadow: 0 6px 18px rgba(176, 33, 255, 0.35);
        }
      `}</style>

      <div className="page">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-title">Admin Panel</div>
        </header>

        {/* Centered login card */}
        <main className="main">
          <div className="card">
            <h1 className="title">Admin Login</h1>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                />
              </div>

              <div className="field">
                <input
                  className="input"
                  type="password"
                  name="password"
                  placeholder="Password"
                  required
                />
              </div>

              {error && <div className="error">{error}</div>}

              <div className="button-wrap">
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
