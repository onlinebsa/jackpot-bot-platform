"use client";

import { useState } from "react";
import { markCommissionPaid } from "./actions";

export function PayoutActions({ id }: { id: string }) {
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleMarkPaid() {
    if (!confirm("Confirm you have paid this by UPI and want to mark it paid?")) return;
    setLoading(true);
    try {
      await markCommissionPaid(id, utr);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input
        placeholder="UPI UTR"
        value={utr}
        onChange={(e) => setUtr(e.target.value)}
        style={{ width: 130, padding: "6px 8px", fontSize: 12 }}
      />
      <button className="btn btn-sm" onClick={handleMarkPaid} disabled={loading}>
        {loading ? "Saving…" : "Mark paid"}
      </button>
    </div>
  );
}
