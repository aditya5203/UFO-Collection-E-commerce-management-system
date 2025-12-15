"use client";

import * as React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <>
      {/* Page styles (layout handled by admin layout) */}
      <style jsx global>{`
        .page-title {
          font-size: 22px;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .stat-card {
          background: #020617;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #111827;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #f9fafb;
        }

        .section-card {
          background: #020617;
          border-radius: 14px;
          border: 1px solid #111827;
          padding: 16px 18px 18px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 500;
        }

        .section-sub {
          font-size: 12px;
          color: #9ca3af;
        }

        .chart-area {
          margin-top: 6px;
          height: 180px;
          border-radius: 12px;
          background: radial-gradient(circle at 0 0, #1f2937, #020617 55%);
          border: 1px solid #111827;
          position: relative;
          overflow: hidden;
        }

        .chart-line {
          position: absolute;
          inset: 14px 10px 16px 10px;
          border-radius: 10px;
          border-left: 1px dashed #1f2937;
          border-bottom: 1px dashed #1f2937;
        }

        .chart-dots {
          position: absolute;
          inset: 20px 16px 18px 16px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .chart-dot {
          flex: 1;
          height: 20px;
          border-radius: 999px;
          background: linear-gradient(to top, #1d4ed8, #38bdf8);
          opacity: 0.5;
        }

        .chart-dot:nth-child(2) {
          height: 40px;
        }
        .chart-dot:nth-child(3) {
          height: 30px;
        }
        .chart-dot:nth-child(4) {
          height: 60px;
        }
        .chart-dot:nth-child(5) {
          height: 45px;
        }
        .chart-dot:nth-child(6) {
          height: 70px;
        }
        .chart-dot:nth-child(7) {
          height: 25px;
        }

        .chart-xaxis {
          position: absolute;
          bottom: 6px;
          left: 18px;
          right: 18px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
        }

        .status-bars {
          margin-top: 6px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 120px;
        }

        .status-bar-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 6px;
        }

        .status-bar {
          width: 70%;
          border-radius: 8px;
          background: #1f2937;
        }

        .status-label {
          font-size: 11px;
          color: #9ca3af;
        }

        .status-bar.pending {
          height: 70px;
        }
        .status-bar.shipped {
          height: 60px;
        }
        .status-bar.delivered {
          height: 80px;
        }
        .status-bar.cancelled {
          height: 40px;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 13px;
        }

        .orders-table th,
        .orders-table td {
          padding: 10px 12px;
          text-align: left;
        }

        .orders-table th {
          font-size: 12px;
          color: #9ca3af;
          border-bottom: 1px solid #111827;
        }

        .orders-table tbody tr + tr td {
          border-top: 1px solid #111827;
        }

        .orders-table tbody tr:nth-child(odd),
        .orders-table tbody tr:nth-child(even) {
          background: #020617;
        }

        .badge {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
        }

        .badge.shipped {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
        }
        .badge.delivered {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .badge.pending {
          background: rgba(234, 179, 8, 0.15);
          color: #facc15;
        }
        .badge.cancelled {
          background: rgba(248, 113, 113, 0.15);
          color: #f97373;
        }

        .two-column {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 18px;
        }

        .small-list {
          margin-top: 8px;
          font-size: 13px;
          display: grid;
          gap: 6px;
        }

        .small-label {
          color: #9ca3af;
          font-size: 12px;
        }

        .small-item {
          display: flex;
          justify-content: space-between;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .two-column {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 820px) {
          .admin-root {
            flex-direction: column;
          }
          .sidebar {
            width: 100%;
            flex-direction: row;
            align-items: center;
            overflow-x: auto;
          }
          .sidebar-footer {
            display: none;
          }
        }
      `}</style>

      <div>
        <h1 className="page-title">Dashboard</h1>

            {/* Top stats */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">1,234</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">$56,789</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Customers</div>
                <div className="stat-value">456</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Products Live</div>
                <div className="stat-value">123</div>
              </div>
            </section>

            {/* Sales overview + Orders by status */}
            <section className="two-column">
              <div className="section-card">
                <div className="section-header">
                  <div>
                    <div className="section-title">Sales Overview</div>
                    <div className="section-sub">
                      Sales last 7 days · Last 7 days{" "}
                      <span style={{ color: "#4ade80" }}>+15%</span>
                    </div>
                  </div>
                  <div className="section-sub">This Week</div>
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  $12,345
                </div>

                <div className="chart-area">
                  <div className="chart-line" />
                  <div className="chart-dots">
                    <div className="chart-dot" />
                    <div className="chart-dot" />
                    <div className="chart-dot" />
                    <div className="chart-dot" />
                    <div className="chart-dot" />
                    <div className="chart-dot" />
                    <div className="chart-dot" />
                  </div>
                  <div className="chart-xaxis">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>

              <div className="section-card">
                <div className="section-header">
                  <div>
                    <div className="section-title">Orders by Status</div>
                    <div className="section-sub">
                      1,234 total ·{" "}
                      <span style={{ color: "#4ade80" }}>+10%</span>
                    </div>
                  </div>
                </div>

                <div className="status-bars">
                  <div className="status-bar-wrap">
                    <div className="status-bar pending" />
                    <div className="status-label">Pending</div>
                  </div>
                  <div className="status-bar-wrap">
                    <div className="status-bar shipped" />
                    <div className="status-label">Shipped</div>
                  </div>
                  <div className="status-bar-wrap">
                    <div className="status-bar delivered" />
                    <div className="status-label">Delivered</div>
                  </div>
                  <div className="status-bar-wrap">
                    <div className="status-bar cancelled" />
                    <div className="status-label">Cancelled</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Orders + side cards */}
            <section className="two-column">
              <div className="section-card">
                <div className="section-header">
                  <div className="section-title">Recent Orders</div>
                </div>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#12345</td>
                      <td>
                        <Link href="#" style={{ color: "#60a5fa" }}>
                          Ethan Harper
                        </Link>
                      </td>
                      <td>$123</td>
                      <td>
                        <span className="badge shipped">Shipped</span>
                      </td>
                      <td>2023-08-15</td>
                    </tr>
                    <tr>
                      <td>#12346</td>
                      <td>
                        <Link href="#" style={{ color: "#60a5fa" }}>
                          Olivia Bennett
                        </Link>
                      </td>
                      <td>$456</td>
                      <td>
                        <span className="badge delivered">Delivered</span>
                      </td>
                      <td>2023-08-14</td>
                    </tr>
                    <tr>
                      <td>#12347</td>
                      <td>
                        <Link href="#" style={{ color: "#60a5fa" }}>
                          Liam Carter
                        </Link>
                      </td>
                      <td>$789</td>
                      <td>
                        <span className="badge pending">Pending</span>
                      </td>
                      <td>2023-08-13</td>
                    </tr>
                    <tr>
                      <td>#12348</td>
                      <td>
                        <Link href="#" style={{ color: "#60a5fa" }}>
                          Sophia Evans
                        </Link>
                      </td>
                      <td>$101</td>
                      <td>
                        <span className="badge cancelled">Cancelled</span>
                      </td>
                      <td>2023-08-12</td>
                    </tr>
                    <tr>
                      <td>#12349</td>
                      <td>
                        <Link href="#" style={{ color: "#60a5fa" }}>
                          Noah Foster
                        </Link>
                      </td>
                      <td>$234</td>
                      <td>
                        <span className="badge shipped">Shipped</span>
                      </td>
                      <td>2023-08-11</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="section-card">
                <div className="section-title">Low Stock Alerts</div>
                <div className="small-list">
                  <div className="small-item">
                    <span>Product A</span>
                    <span className="small-label">10 items left</span>
                  </div>
                  <div className="small-item">
                    <span>Product B</span>
                    <span className="small-label">5 items left</span>
                  </div>
                  <div className="small-item">
                    <span>Product C</span>
                    <span className="small-label">2 items left</span>
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <div className="section-title">New Users This Week</div>
                  <div className="small-list">
                    <div className="small-item">
                      <span>Alex Johnson</span>
                      <span className="small-label">2023-08-15</span>
                    </div>
                    <div className="small-item">
                      <span>Maria Lopez</span>
                      <span className="small-label">2023-08-14</span>
                    </div>
                    <div className="small-item">
                      <span>David Kim</span>
                      <span className="small-label">2023-08-13</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
      </div>
    </>
  );
}
