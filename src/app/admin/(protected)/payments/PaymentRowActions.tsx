"use client";

import { useState } from "react";
import { approvePayment, rejectPayment, getScreenshotUrl, markTvAccessGranted } from "./actions";

export function PaymentRowActions({
  paymentId,
  screenshotPath,
  status,
  tvGranted,
  tvUsername,
}: {
  paymentId: string;
  screenshotPath: string | null;
  status: string;
  tvGranted: boolean;
  tvUsername: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);

  async function handleApprove() {
    if (!confirm("Approve this payment and activate the customer's plan?")) return;
    setLoading(true);
    try {
      await approvePayment(paymentId);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  async function handleReject() {
    if (!confirm("Reject this payment?")) return;
    setLoading(true);
    try {
      await rejectPayment(paymentId);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  async function handleView() {
    if (!screenshotPath) return;
    const url = await getScreenshotUrl(screenshotPath);
    if (url) window.open(url, "_blank");
    else alert("Could not load screenshot.");
  }

  async function handleGrantTv() {
    if (!confirm(`Mark TradingView access as granted for "${tvUsername}"?`)) return;
    setGrantLoading(true);
    try {
      await markTvAccessGranted(paymentId);
    } catch (e: any) {
      alert(e.message);
    }
    setGrantLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {screenshotPath && (
          <button className="btn-secondary btn-sm" onClick={handleView}>View proof</button>
        )}
        {status === "pending" && (
          <>
            <button className="btn btn-sm" onClick={handleApprove} disabled={loading}>Approve</button>
            <button className="btn-danger btn-sm" onClick={handleReject} disabled={loading}>Reject</button>
          </>
        )}
      </div>

      {status === "approved" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            TV username: {tvUsername || <span className="muted">not provided</span>}
          </span>
          {!tvGranted ? (
            <button className="btn btn-sm" onClick={handleGrantTv} disabled={grantLoading || !tvUsername}>
              {grantLoading ? "Granting…" : "Grant TV access"}
            </button>
          ) : (
            <span className="badge badge-approved" style={{ fontSize: 11, width: "fit-content" }}>TV access granted</span>
          )}
        </div>
      )}
    </div>
  );
}