"use client";

import { useState } from "react";

type Point = { label: string; value: number };

export function RevenueChart({ daily, monthly }: { daily: Point[]; monthly: Point[] }) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const data = view === "daily" ? daily : monthly;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase" }}>Revenue</div>
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
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: "100%",
                background: "var(--amber)",
                borderRadius: "2px 2px 0 0",
                height: `${Math.max(4, (d.value / max) * 110)}px`,
              }}
              title={`₹${d.value.toLocaleString("en-IN")}`}
            />
            <div className="muted" style={{ fontSize: 11 }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
