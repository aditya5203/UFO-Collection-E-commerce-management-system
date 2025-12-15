"use client";

import AdminSidebar from "./_components/AdminSidebar";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">{children}</div>

      <style jsx global>{`
        .admin-shell {
          min-height: 100vh;
          display: flex;
          background: #0b1220;
          color: #e5e7eb;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .admin-main {
          flex: 1;
          padding: 24px 28px 40px;
          overflow: hidden;
        }

        .admin-sidebar {
          width: 240px;
          background: #020817;
          border-right: 1px solid #111827;
          padding: 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sidebar-brand {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #f8fafc;
        }

        .admin-nav {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          color: #e5e7eb;
          text-decoration: none;
          font-size: 14px;
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

        .sidebar-foot {
          margin-top: auto;
          font-size: 11px;
          color: #6b7280;
        }

        @media (max-width: 900px) {
          .admin-shell {
            flex-direction: column;
          }

          .admin-sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            overflow-x: auto;
            border-right: none;
            border-bottom: 1px solid #111827;
          }

          .sidebar-foot {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
