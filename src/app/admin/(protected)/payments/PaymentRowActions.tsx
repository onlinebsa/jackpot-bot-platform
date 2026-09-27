"use client";

import { useState } from "react";
import { approvePayment, rejectPayment, getScreenshotUrl } from "./actions";

export function PaymentRowActions({ paymentId, screenshotPath }: { paymentId: string; screenshotPath: string | null }) {
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {screenshotPath && (
        <button className="btn-secondary btn-sm" onClick={handleView}>View proof</button>
      )}
      <button className="btn btn-sm" onClick={handleApprove} disabled={loading}>Approve</button>
      <button className="btn-danger btn-sm" onClick={handleReject} disabled={loading}>Reject</button>
    </div>
  );
}
