"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MARKETS = ["Crypto Futures", "Forex", "Indian F&O", "MCX"];
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="wrap"><p className="muted">Loading…</p></div>}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    whatsapp_number: "",
    same_as_whatsapp: "yes",
    calling_number: "",
    password: "",
    address_village_town: "",
    address_district: "",
    address_state: "",
    address_pincode: "",
    heard_from: "YouTube",
    referral_code: "",
    trading_experience: "0-1",
    profession: "Private job",
  });
  const [markets, setMarkets] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleMarket(m: string) {
    setMarkets((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6 || form.password.length > 12) {
      setError("Password must be 6–12 characters.");
      return;
    }
    if (markets.length === 0) {
      setError("Select at least one market you trade.");
      return;
    }
    if (!/^\d{6}$/.test(form.address_pincode)) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    const calling_number = form.same_as_whatsapp === "yes" ? form.whatsapp_number : form.calling_number;
    if (form.same_as_whatsapp === "no" && !form.calling_number) {
      setError("Enter your calling number.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          full_name: form.full_name,
          whatsapp_number: form.whatsapp_number,
          calling_number,
          address_village_town: form.address_village_town,
          address_district: form.address_district,
          address_state: form.address_state,
          address_pincode: form.address_pincode,
          heard_from: form.heard_from,
          referral_code: form.referral_code || null,
          trading_experience: form.trading_experience,
          markets_traded: markets,
          profession: form.profession,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const plan = searchParams.get("plan");
    router.push(plan ? `/dashboard/payment?plan=${plan}` : "/dashboard");
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Create your account</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Already have one? <Link href="/login">Log in</Link>
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Username *</label>
          <input required value={form.username} onChange={(e) => update("username", e.target.value)} />
        </div>
        <div className="field">
          <label>Full name *</label>
          <input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
        </div>
        <div className="field">
          <label>Email *</label>
          <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="field">
          <label>WhatsApp number *</label>
          <input required value={form.whatsapp_number} onChange={(e) => update("whatsapp_number", e.target.value)} />
        </div>
        <div className="field">
          <label>Calling number same as WhatsApp? *</label>
          <select value={form.same_as_whatsapp} onChange={(e) => update("same_as_whatsapp", e.target.value)}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {form.same_as_whatsapp === "no" && (
          <div className="field">
            <label>Calling number *</label>
            <input required value={form.calling_number} onChange={(e) => update("calling_number", e.target.value)} />
          </div>
        )}
        <div className="field">
          <label>Address — Village/Town *</label>
          <input required value={form.address_village_town} onChange={(e) => update("address_village_town", e.target.value)} />
        </div>
        <div className="field">
          <label>District *</label>
          <input required value={form.address_district} onChange={(e) => update("address_district", e.target.value)} />
        </div>
        <div className="field">
          <label>State / Pincode *</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              required
              value={form.address_state}
              onChange={(e) => update("address_state", e.target.value)}
              style={{ flex: 1.5, height: 42, boxSizing: "border-box" }}
            >
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              required
              value={form.address_pincode}
              onChange={(e) => update("address_pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Pincode"
              style={{ flex: 1, height: 42, boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div className="field">
          <label>Password * (6–12 chars, e.g. name+number+symbol)</label>
          <input required type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
        </div>
        <div className="field">
          <label>How did you hear about us? *</label>
          <select value={form.heard_from} onChange={(e) => update("heard_from", e.target.value)}>
            <option>YouTube</option>
            <option>Instagram</option>
            <option>Facebook</option>
            <option>Referral</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field">
          <label>Referral code (optional)</label>
          <input value={form.referral_code} onChange={(e) => update("referral_code", e.target.value)} />
        </div>
        <div className="field">
          <label>Trading experience *</label>
          <select value={form.trading_experience} onChange={(e) => update("trading_experience", e.target.value)}>
            <option value="0-1">0–1 yrs</option>
            <option value="1-3">1–3 yrs</option>
            <option value="3-5">3–5 yrs</option>
            <option value="5-10">5–10 yrs</option>
            <option value="10+">10+ yrs</option>
          </select>
        </div>
        <div className="field">
          <label>Markets traded * (select all that apply)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {MARKETS.map((m) => (
              <label key={m} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13.5 }}>
                <input type="checkbox" checked={markets.includes(m)} onChange={() => toggleMarket(m)} style={{ width: "auto" }} />
                {m}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Profession *</label>
          <select value={form.profession} onChange={(e) => update("profession", e.target.value)}>
            <option>Private job</option>
            <option>Govt. job</option>
            <option>Businessman</option>
            <option>Freelancer</option>
            <option>No work</option>
          </select>
        </div>

        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <button className="btn" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}