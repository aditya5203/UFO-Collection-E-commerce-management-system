"use client";

import AdminSidebar from "./_components/AdminSidebar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      {/* ✅ Fixed Sidebar */}
      <aside className="admin-sidebar-fixed">
        <AdminSidebar />
      </aside>

      {/* ✅ Main Content Scrolls */}
      <main className="admin-main">{children}</main>

      <style jsx global>{`
        :root {
          --admin-sidebar-w: 240px;
          --admin-bg: #0b1220;
        }

        /* ===== Shell ===== */
        .admin-shell {
          height: 100vh;
          background: var(--admin-bg);
          color: #e5e7eb;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        /* ===== Fixed Sidebar ===== */
        .admin-sidebar-fixed {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--admin-sidebar-w);
          z-index: 50;
          background: #020817;
          border-right: 1px solid #111827;
          overflow: hidden;
        }

        /* ===== Main Content ===== */
        .admin-main {
          height: 100vh;
          margin-left: var(--admin-sidebar-w);
          padding: 24px 28px 40px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* ===== Sidebar Inner Layout ===== */
        .admin-sidebar {
          width: 100%;
          height: 100%;
          padding: 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 0; /* IMPORTANT */
        }

        .sidebar-brand {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #f8fafc;
        }

        /* Allow nav area to grow */
        .admin-sidebar nav {
          flex: 1;
          min-height: 0;
        }

        /* ===== Scrollable Menu ===== */
        .admin-nav {
          list-style: none;
          padding: 0;
          margin: 0;

          display: flex;
          flex-direction: column;
          gap: 6px;

          height: 100%;
          overflow-y: auto;
          min-height: 0;
          padding-right: 6px;
        }

        /* Scrollbar Styling */
        .admin-nav::-webkit-scrollbar {
          width: 6px;
        }
        .admin-nav::-webkit-scrollbar-thumb {
          background: #1f2937;
          border-radius: 999px;
        }

        /* ===== Nav Links ===== */
        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          color: #e5e7eb;
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .admin-nav-link:hover:not(.active) {
          background: #111827;
        }

        .admin-nav-link.active {
          background: #111827;
          border: 1px solid #1f2937;
        }

        .admin-nav-icon {
          display: inline-flex;
          width: 20px;
          height: 20px;
          align-items: center;
          justify-content: center;
        }

        /* ===== Footer / Logout ===== */
        .sidebar-foot {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

        /* ===== Mobile Layout ===== */
        @media (max-width: 900px) {
          .admin-sidebar-fixed {
            position: sticky;
            top: 0;
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #111827;
          }

          .admin-main {
            margin-left: 0;
            height: calc(100vh - 70px);
          }

          .admin-sidebar {
            flex-direction: row;
            align-items: center;
            overflow-x: auto;
          }

          .admin-sidebar nav {
            flex: unset;
          }

          .admin-nav {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            height: auto;
          }

          .sidebar-foot {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
