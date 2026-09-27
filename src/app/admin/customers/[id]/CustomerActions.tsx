"use client";

import { useState } from "react";
import { resetCustomerPassword } from "./actions";

export function CustomerActions({ userId, whatsapp }: { userId: string; whatsapp: string }) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirm("Generate a new password for this customer?")) return;
    setLoading(true);
    try {
      const pwd = await resetCustomerPassword(userId);
      setNewPassword(pwd);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi! This is ApexSignal support regarding your Jackpot Bot account."
  )}`;

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <button className="btn-secondary btn-sm" onClick={handleReset} disabled={loading}>
        {loading ? "Resetting…" : "Reset password"}
      </button>
      <a href={waLink} target="_blank" className="btn-secondary btn-sm">Message on WhatsApp</a>
      {newPassword && (
        <span className="muted" style={{ fontSize: 13 }}>
          New password: <strong style={{ color: "var(--text)" }}>{newPassword}</strong> (share this with the customer)
        </span>
      )}
    </div>
  );
}
