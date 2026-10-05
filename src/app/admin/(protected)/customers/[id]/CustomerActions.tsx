"use client";

import { useState } from "react";
import { resetCustomerPassword, toggleTvAccess } from "./actions";

export function CustomerActions({
  userId,
  whatsapp,
  tvAccessGiven,
}: {
  userId: string;
  whatsapp: string;
  tvAccessGiven: boolean;
}) {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tvGiven, setTvGiven] = useState(tvAccessGiven);
  const [tvLoading, setTvLoading] = useState(false);

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

  async function handleTvToggle() {
    setTvLoading(true);
    try {
      const next = !tvGiven;
      await toggleTvAccess(userId, next);
      setTvGiven(next);
    } catch (e: any) {
      alert(e.message);
    }
    setTvLoading(false);
  }

  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi! This is Jackpot Bot support regarding your account."
  )}`;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
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

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 3,
            background: tvGiven ? "rgba(63,182,139,0.15)" : "rgba(229,72,77,0.15)",
            color: tvGiven ? "#3FB68B" : "#E5484D",
          }}
        >
          TradingView access: {tvGiven ? "Given" : "Not given"}
        </span>
        <button className="btn-secondary btn-sm" onClick={handleTvToggle} disabled={tvLoading}>
          {tvLoading ? "Updating…" : tvGiven ? "Mark as revoked" : "Mark as given"}
        </button>
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
        This is a manual checklist — you still need to add/remove the username on TradingView's "Manage access" page yourself.
      </p>
    </div>
  );
}