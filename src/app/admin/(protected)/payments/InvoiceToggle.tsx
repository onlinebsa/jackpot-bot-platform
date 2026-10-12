"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setInvoiceVisible } from "./actions";

export function InvoiceToggle({ paymentId, visible }: { paymentId: string; visible: boolean }) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(visible);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const next = !isVisible;
      await setInvoiceVisible(paymentId, next);
      setIsVisible(next);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <span
        style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 3,
          background: isVisible ? "rgba(63,182,139,0.15)" : "rgba(229,72,77,0.15)",
          color: isVisible ? "#3FB68B" : "#E5484D",
        }}
      >
        {isVisible ? "Visible" : "Hidden"}
      </span>
      <button type="button" className="btn-secondary btn-sm" onClick={handleToggle} disabled={loading}>
        {loading ? "Updating…" : isVisible ? "Hide invoice" : "Show invoice"}
      </button>
    </div>
  );
}