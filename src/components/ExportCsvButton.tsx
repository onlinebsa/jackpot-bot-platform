"use client";

import { useState } from "react";

export function ExportCsvButton({ basePath, extraParams }: { basePath: string; extraParams?: Record<string, string> }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function buildUrl() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (extraParams) Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
      <div className="field" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: 12 }}>From date</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: 12 }}>To date</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <a href={buildUrl()} className="btn-secondary" style={{ height: 38, display: "inline-flex", alignItems: "center" }}>
        Download CSV
      </a>
    </div>
  );
}