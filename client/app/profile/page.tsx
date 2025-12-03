"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const router = useRouter();

  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    height: "",
    weight: "",
    menSize: "",
    womenSize: "",
  });

  // ----------------------------------------------------
  // HANDLE INPUT CHANGE
  // ----------------------------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------------------------------
  // SAVE PROFILE  -> PATCH /auth/profile
  // ----------------------------------------------------
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

      const res = await fetch(`${apiBase}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          height: form.height ? Number(form.height) : undefined,
          weight: form.weight ? Number(form.weight) : undefined,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        alert(data?.message || "Failed to update");
        setSaving(false);
        return;
      }

      const updated = data.user;

      setForm((prev) => ({
        ...prev,
        menSize: updated.recommendedSizeMen || "",
        womenSize: updated.recommendedSizeWomen || "",
      }));

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // LOAD PROFILE DATA -> GET /auth/me
  // ----------------------------------------------------
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

        const res = await fetch(`${apiBase}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        // If not logged in -> go to login
        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          console.error("Error loading /auth/me", res.status);
          router.push("/login");
          return;
        }

        const data = await res.json().catch(() => ({} as any));

        if (!data || !data.user) {
          console.warn("No user in /auth/me response:", data);
          router.push("/login");
          return;
        }

        const u = data.user;

        setForm({
          name: u.name || "",
          email: u.email || "",
          height: u.height ? String(u.height) : "",
          weight: u.weight ? String(u.weight) : "",
          menSize: u.recommendedSizeMen || "",
          womenSize: u.recommendedSizeWomen || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  // ----------------------------------------------------
  // LOADING UI
  // ----------------------------------------------------
  if (loading) {
    return (
      <>
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

          body {
            margin: 0;
            background: #050611;
            color: #f5f5f7;
            font-family: Poppins, sans-serif;
          }
          .loading-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
        <div className="loading-wrap">Loading profile…</div>
      </>
    );
  }

  // ----------------------------------------------------
  // PAGE
  // ----------------------------------------------------
  return (
    <>
      {/* --------------------------------------------------- */}
      {/* GLOBAL UFO CSS */}
      {/* --------------------------------------------------- */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");

        :root {
          --bg-main: #050611;
          --bg-card: #101223;
          --bg-input: #181a2c;
          --border-soft: #23253a;
          --text-main: #f5f5f7;
          --text-muted: #8b90ad;
          --brand: #b49cff;
          --brand-soft: #c9b9ff;
          --max: 1160px;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: var(--bg-main);
          color: var(--text-main);
          font-family: Poppins, sans-serif;
        }

        /* TOP BAR */
        .topbar {
          height: 80px;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #191b2d;
          background: rgba(5, 6, 17, 0.96);
          backdrop-filter: blur(12px);
        }

        .top-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .back-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 22px;
          cursor: pointer;
        }

        .brand-logo {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #fff;
        }

        .brand-text {
          font-size: 28px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }

        .profile-icon {
          width: 44px;
          height: 44px;
          background: #fff;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* MAIN */
        .profile-main {
          padding: 40px;
          display: flex;
          justify-content: center;
        }

        .profile-card {
          background: var(--bg-card);
          width: 100%;
          max-width: 650px;
          border-radius: 18px;
          border: 1px solid #22253a;
          padding: 30px;
        }

        .profile-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .section-title {
          margin-top: 18px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }

        .field-label {
          margin-top: 14px;
          margin-bottom: 4px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .field-input {
          width: 100%;
          padding: 11px 12px;
          background: var(--bg-input);
          border-radius: 8px;
          border: 1px solid var(--border-soft);
          color: var(--text-main);
          font-size: 13px;
        }

        .field-input::placeholder {
          color: #787e99;
        }

        .field-input:focus {
          border-color: var(--brand-soft);
          box-shadow: 0 0 0 1px rgba(180, 156, 255, 0.4);
          outline: none;
        }

        .field-input[disabled] {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .save-btn {
          margin-top: 22px;
          padding: 12px 20px;
          border-radius: 999px;
          background: #2f7efc;
          border: none;
          color: white;
          font-weight: 500;
          cursor: pointer;
          float: right;
        }

        .save-btn:hover {
          filter: brightness(1.05);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .profile-main {
            padding: 20px;
          }
          .topbar {
            padding: 0 16px;
          }
          .brand-text {
            font-size: 20px;
          }
        }
      `}</style>

      {/* --------------------------------------------------- */}
      {/* HEADER */}
      {/* --------------------------------------------------- */}
      <header className="topbar">
        <div className="top-left">
          <button className="back-btn" onClick={() => router.back()}>
            ←
          </button>

          <div className="brand-logo">
            <Image src="/images/logo.png" alt="logo" width={54} height={54} />
          </div>

          <span className="brand-text">UFO Collection</span>
        </div>

        <div className="profile-icon">
          <Image src="/images/profile.png" width={20} height={20} alt="profile" />
        </div>
      </header>

      {/* --------------------------------------------------- */}
      {/* MAIN CONTENT */}
      {/* --------------------------------------------------- */}
      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-title">My Profile</div>

          <form onSubmit={handleSave}>
            {/* PERSONAL */}
            <div className="section-title">Personal Information</div>

            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              className="field-input"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your name"
            />

            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field-input"
              value={form.email}
              disabled
              placeholder="Your email"
            />

            {/* FIT */}
            <div className="section-title">Fit Preferences</div>

            <label className="field-label" htmlFor="height">
              Height (feet)
            </label>
            <input
              id="height"
              name="height"
              className="field-input"
              value={form.height}
              onChange={handleChange}
              placeholder="e.g. 5.6"
            />

            <label className="field-label" htmlFor="weight">
              Weight (kg)
            </label>
            <input
              id="weight"
              name="weight"
              className="field-input"
              value={form.weight}
              onChange={handleChange}
              placeholder="e.g. 60"
            />

            {/* SIZE */}
            <div className="section-title">Size Recommendations</div>

            <label className="field-label" htmlFor="menSize">
              Men&apos;s Size
            </label>
            <input
              id="menSize"
              className="field-input"
              value={form.menSize}
              disabled
              placeholder="Calculated automatically"
            />

            <label className="field-label" htmlFor="womenSize">
              Women&apos;s Size
            </label>
            <input
              id="womenSize"
              className="field-input"
              value={form.womenSize}
              disabled
              placeholder="Calculated automatically"
            />

            <button className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
