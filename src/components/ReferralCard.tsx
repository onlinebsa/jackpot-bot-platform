"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COMMISSION_BY_PLAN, PAYOUT_DAY } from "@/lib/referral";

type Reward = {
  name: string | null;
  joined_at: string;
  plan: string | null;
  amount: number | null;
  payable_on: string | null;
  status: "pending" | "requested" | "paid" | null;
  paid_at: string | null;
  payout_utr: string | null;
};

const PLAN_LABEL: Record<string, string> = { monthly: "Monthly", onetime: "2-Year Plan" };

export function ReferralCard({ code, upiId, referrals }: { code: string; upiId: string; referrals: Reward[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [upi, setUpi] = useState(upiId);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => { setLink(`${window.location.origin}/signup?ref=${code}`); }, [code]);

  const today = new Date().toISOString().slice(0, 10);
  const converted = referrals.filter((r) => r.status);
  const unlocked = converted.filter((r) => r.status === "pending" && r.payable_on && r.payable_on <= today);
  const locked = converted.filter((r) => r.status === "pending" && r.payable_on && r.payable_on > today);
  const requested = converted.filter((r) => r.status === "requested");
  const paid = converted.filter((r) => r.status === "paid");

  const totalEarned = converted.reduce((s, r) => s + Number(r.amount || 0), 0);
  const availableNow = unlocked.reduce((s, r) => s + Number(r.amount || 0), 0);
  const canRequest = availableNow > 0;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function requestPayout() {
    setError(""); setMsg("");
    if (upi.trim().length < 3) { setError("Enter your UPI ID first (e.g. name@bank)."); return; }
    setLoading(true);
    const { error } = await supabase.rpc("request_payout", { p_upi: upi.trim() });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMsg("Payout requested — we'll transfer it to your UPI ID and mark it paid here once done.");
    router.refresh();
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>Refer &amp; earn</div>
      <p className="muted" style={{ marginBottom: 12 }}>
        Earn ₹{COMMISSION_BY_PLAN.monthly} when a friend joins with your code and takes the Monthly plan,
        or ₹{COMMISSION_BY_PLAN.onetime} for the 2-Year Plan. Rewards unlock on the {PAYOUT_DAY}th of the
        month after their payment is approved.
      </p>

      <div className="field">
        <label>Your referral code</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input readOnly value={code} style={{ flex: 1, fontWeight: 700, letterSpacing: 1 }} />
          <button className="btn-secondary" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
        </div>
        <span className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>{link}</span>
      </div>

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="num">{converted.length}</div><div className="label">Friends who bought a plan</div></div>
        <div className="stat-card"><div className="num">₹{totalEarned.toLocaleString("en-IN")}</div><div className="label">Total earned</div></div>
        <div className="stat-card"><div className="num">₹{availableNow.toLocaleString("en-IN")}</div><div className="label">Ready to withdraw</div></div>
      </div>

      <div className="field">
        <label>Your UPI ID (for payout)</label>
        <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" />
      </div>
      <button className="btn" onClick={requestPayout} disabled={!canRequest || loading}>
        {loading ? "Requesting…" : canRequest ? `Withdraw ₹${availableNow.toLocaleString("en-IN")}` : "Nothing to withdraw yet"}
      </button>
      {!!requested.length && (
        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          ₹{requested.reduce((s, r) => s + Number(r.amount || 0), 0).toLocaleString("en-IN")} already requested — paid by UPI on the {PAYOUT_DAY}th.
        </p>
      )}
      {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
      {msg && <p style={{ marginTop: 8, color: "var(--green)", fontSize: 13 }}>{msg}</p>}

      {!!referrals.length && (
        <div style={{ marginTop: 20 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 6 }}>Referral history</div>
          <table>
            <thead><tr><th>Name</th><th>Joined</th><th>Plan</th><th>Reward</th></tr></thead>
            <tbody>
              {referrals.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td className="muted">{new Date(r.joined_at).toLocaleDateString("en-IN")}</td>
                  <td className="muted">{r.plan ? PLAN_LABEL[r.plan] ?? r.plan : "—"}</td>
                  <td>
                    {!r.status && <span className="badge badge-pending">not bought yet</span>}
                    {r.status === "pending" && (r.payable_on && r.payable_on <= today
                      ? <span className="badge badge-approved">₹{r.amount} ready</span>
                      : <span className="badge badge-pending">₹{r.amount} unlocks {r.payable_on ? new Date(r.payable_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>)}
                    {r.status === "requested" && <span className="badge badge-pending">₹{r.amount} requested</span>}
                    {r.status === "paid" && <span className="badge badge-approved">₹{r.amount} paid · {r.payout_utr}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
