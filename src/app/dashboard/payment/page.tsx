"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PRICES: Record<string, number> = { monthly: 5000, onetime: 60000 };
const RAZORPAY_LINKS: Record<string, string> = {
  monthly: process.env.NEXT_PUBLIC_RAZORPAY_MONTHLY_LINK || "",
  onetime: process.env.NEXT_PUBLIC_RAZORPAY_ONETIME_LINK || "",
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [plan, setPlan] = useState(searchParams.get("plan") === "onetime" ? "onetime" : "monthly");
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUserId(data.user.id);
    });
  }, []);

  const basePrice = PRICES[plan];
  const finalPrice = discount ? Math.round(basePrice * (1 - discount / 100)) : basePrice;

  async function applyPromo() {
    setPromoError("");
    setDiscount(null);
    if (!promo) return;
    const { data, error } = await supabase.rpc("validate_promo_code", { p_code: promo });
    if (error || data === null) {
      setPromoError("Invalid promo code.");
      return;
    }
    setDiscount(data);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!utr || !file || !userId) {
      setError("Enter the UTR and upload your payment screenshot.");
      return;
    }
    setSubmitting(true);

    const path = `${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("payment-screenshots").upload(path, file);
    if (uploadError) {
      setSubmitting(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("payments").insert({
      user_id: userId,
      plan,
      amount: finalPrice,
      promo_code: promo || null,
      utr,
      screenshot_url: path,
      method: "manual",
      status: "pending",
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="wrap">
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Payment submitted ✓</h2>
          <p className="muted">
            We've received your payment details. Our team will verify and activate your access shortly —
            you'll be notified once approved.
          </p>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Complete your payment</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="monthly">Monthly — ₹5,000</option>
            <option value="onetime">2-Year Plan — ₹60,000</option>
          </select>
        </div>
        <div className="field">
          <label>Promo code (optional)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={promo} onChange={(e) => setPromo(e.target.value)} style={{ flex: 1 }} />
            <button type="button" className="btn-secondary" onClick={applyPromo}>Apply</button>
          </div>
          {promoError && <p className="error">{promoError}</p>}
          {discount !== null && <p className="muted" style={{ color: "var(--green)" }}>{discount}% off applied</p>}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", marginTop: 8 }}>
          ₹{finalPrice.toLocaleString("en-IN")}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Option A — Pay via Razorpay</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Pay through our secure Razorpay link, then come back and submit your UTR below so we can match it.
        </p>
        {RAZORPAY_LINKS[plan] ? (
          <a href={RAZORPAY_LINKS[plan]} target="_blank" className="btn" style={{ display: "inline-block" }}>
            Pay ₹{finalPrice.toLocaleString("en-IN")} on Razorpay
          </a>
        ) : (
          <p className="muted">Payment link coming soon — use the manual option below.</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Option B — Manual UPI + submit for approval</h3>
        <form onSubmit={handleManualSubmit}>
          <div className="field">
            <label>UTR / Transaction number *</label>
            <input required value={utr} onChange={(e) => setUtr(e.target.value)} />
          </div>
          <div className="field">
            <label>Payment screenshot *</label>
            <input required type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
          <button className="btn" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
