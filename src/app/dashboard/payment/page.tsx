"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PRICES: Record<string, number> = { monthly: 5000, onetime: 60000 };

// Razorpay embedded payment button IDs (monthly = JB Starter, onetime = JB Elite Pro)
const RAZORPAY_BUTTON_IDS: Record<string, string> = {
  monthly: "pl_TkhhsSNex3JjPy",
  onetime: "pl_Tkhpq6lz6pbogj",
};

// Renders Razorpay's official payment button script inside a form.
// Re-mounts whenever the button ID changes (i.e. when the plan is switched).
function RazorpayButton({ buttonId }: { buttonId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    form.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.async = true;
    script.setAttribute("data-payment_button_id", buttonId);
    form.appendChild(script);
    return () => {
      form.innerHTML = "";
    };
  }, [buttonId]);

  return <form ref={formRef} />;
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="wrap"><p className="muted">Loading…</p></div>}>
      <PaymentPageInner />
    </Suspense>
  );
}

function PaymentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [plan, setPlan] = useState(searchParams.get("plan") === "onetime" ? "onetime" : "monthly");
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");
  const [utr, setUtr] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tvUsername, setTvUsername] = useState("");
  const [tvError, setTvError] = useState("");
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
      setPromoError("Invalid or expired promo code.");
      return;
    }
    setDiscount(data);
  }

  function validateTvUsername() {
    if (!tvUsername.trim()) {
      setTvError("Enter your TradingView username — this is required to grant indicator access.");
      return false;
    }
    setTvError("");
    return true;
  }

  // Capture-phase handler on the wrapper around the Razorpay button:
  // blocks the click if the TradingView username is missing, otherwise saves it to the profile.
  async function handleRazorpayClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (!validateTvUsername() || !userId) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    await supabase.from("profiles").update({ tradingview_username: tvUsername.trim() }).eq("id", userId);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateTvUsername()) return;
    if (!utr || !file || !userId) {
      setError("Enter the UTR and upload your payment screenshot.");
      return;
    }
    setSubmitting(true);

    const { data: alreadyUsed, error: utrCheckError } = await supabase.rpc("is_utr_used", { p_utr: utr });
    if (utrCheckError) {
      setSubmitting(false);
      setError("Could not verify this transaction number. Please try again.");
      return;
    }
    if (alreadyUsed) {
      setSubmitting(false);
      setError("This UTR / transaction number has already been submitted. Each transaction can only be used once. If this is a mistake, contact support.");
      return;
    }

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
      tradingview_username: tvUsername.trim(),
    });

    if (!insertError) {
      await supabase.from("profiles").update({ tradingview_username: tvUsername.trim() }).eq("id", userId);
    }

    setSubmitting(false);
    if (insertError) {
      if (insertError.message.toLowerCase().includes("duplicate") || insertError.code === "23505") {
        setError("This UTR / transaction number has already been submitted.");
      } else {
        setError(insertError.message);
      }
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
            <option value="monthly">JB Starter — ₹5,000</option>
            <option value="onetime">JB Elite Pro — ₹60,000</option>
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

      <div className="card" style={{ marginBottom: 16, borderColor: "var(--red)", background: "rgba(229,72,77,0.06)" }}>
        <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--red)" }}>⚠ Stay safe from scams</h3>
        <ul className="muted" style={{ paddingLeft: 18, lineHeight: 1.7, fontSize: 13 }}>
          <li>Only pay through the official Razorpay button below, or the UPI ID shared on this page — never to any other UPI ID, QR code, or bank account.</li>
          <li>Before paying, check the website address in your browser matches our official site exactly.</li>
          <li>We will never call, message, or DM you first asking for payment, OTP, or your password.</li>
          <li>If anyone using our name, a similar name, or a "support agent" asks you to pay them directly, it is a scam — do not pay, and report it to us.</li>
          <li>We are not responsible for any payment sent to an unofficial link, account, or person outside this page.</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>TradingView username * (required to grant indicator access)</label>
          <input
            required
            value={tvUsername}
            onChange={(e) => { setTvUsername(e.target.value); if (tvError) setTvError(""); }}
            placeholder="Your exact TradingView username"
          />
          {tvError && <p className="error" style={{ marginTop: 6 }}>{tvError}</p>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Option A — Pay via Razorpay</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Pay through our secure Razorpay button, then come back and submit your UTR below so we can match it.
        </p>
        {RAZORPAY_BUTTON_IDS[plan] ? (
          <div onClickCapture={handleRazorpayClickCapture}>
            <RazorpayButton buttonId={RAZORPAY_BUTTON_IDS[plan]} />
          </div>
        ) : (
          <p className="muted">Payment button coming soon — use the manual option below.</p>
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
