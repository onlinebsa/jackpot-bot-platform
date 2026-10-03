"use client";

import { useState } from "react";

type Point = { label: string; value: number; users: number };

function revenueColor(value: number, max: number) {
  if (max === 0) return "#555";
  const pct = value / max;
  if (pct >= 0.7) return "#3FB68B"; // green = strong day
  if (pct >= 0.35) return "#F5A623"; // amber = average day
  return "#E5484D"; // red = weak day
}

export function RevenueChart({ daily, monthly }: { daily: Point[]; monthly: Point[] }) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const data = view === "daily" ? daily : monthly;
  const maxRevenue = Math.max(1, ...data.map((d) => d.value));
  const maxUsers = Math.max(1, ...data.map((d) => d.users));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>Revenue & Active Users</div>
        <div className="modeswitch" style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 3, padding: 2 }}>
          {(["daily", "monthly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? "var(--surface)" : "none",
                color: view === v ? "var(--text)" : "var(--muted)",
                border: "none", padding: "6px 14px", borderRadius: 2, fontSize: 12, fontWeight: 600,
              }}
            >
              {v === "daily" ? "Last 7 days" : "Last 6 months"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 14, fontSize: 11 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#3FB68B", display: "inline-block" }} />
          <span className="muted">Strong revenue day</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#F5A623", display: "inline-block" }} />
          <span className="muted">Average</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#E5484D", display: "inline-block" }} />
          <span className="muted">Weak</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#4EA8DE", display: "inline-block" }} />
          <span className="muted">Active users</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 130, width: "100%", justifyContent: "center" }}>
              <div
                style={{
                  width: "45%",
                  background: revenueColor(d.value, maxRevenue),
                  borderRadius: "2px 2px 0 0",
                  height: `${Math.max(4, (d.value / maxRevenue) * 120)}px`,
                }}
                title={`Revenue: ₹${d.value.toLocaleString("en-IN")}`}
              />
              <div
                style={{
                  width: "25%",
                  background: "#4EA8DE",
                  borderRadius: "2px 2px 0 0",
                  height: `${Math.max(4, (d.users / maxUsers) * 120)}px`,
                }}
                title={`Active users: ${d.users}`}
              />
            </div>
            <div className="muted" style={{ fontSize: 11 }}>{d.label}</div>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>₹{d.value.toLocaleString("en-IN")} · {d.users}u</div>
          </div>
        ))}
      </div>
    </div>
  );
}
