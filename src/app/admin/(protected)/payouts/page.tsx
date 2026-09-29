import { createAdminClient } from "@/lib/supabase/admin";
import { PayoutActions } from "./PayoutActions";

const PLAN_LABEL: Record<string, string> = { monthly: "Monthly", onetime: "2-Year Plan" };

export default async function PayoutsPage() {
  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("commissions")
    .select("*, profiles!commissions_referrer_id_fkey(full_name, whatsapp_number, upi_id)")
    .order("payable_on", { ascending: true });

  const today = new Date().toISOString().slice(0, 10);
  const requested = (rows ?? []).filter((r: any) => r.status === "requested");
  const upcoming = (rows ?? []).filter((r: any) => r.status === "pending");
  const paid = (rows ?? []).filter((r: any) => r.status === "paid");

  const requestedTotal = requested.reduce((s: number, r: any) => s + Number(r.amount), 0);

  function Row({ r, showUpi }: { r: any; showUpi?: boolean }) {
    return (
      <tr key={r.id}>
        <td>{r.profiles?.full_name}<div className="muted" style={{ fontSize: 12 }}>{r.profiles?.whatsapp_number}</div></td>
        <td>{PLAN_LABEL[r.plan] ?? r.plan}</td>
        <td>₹{Number(r.amount).toLocaleString("en-IN")}</td>
        <td className="muted">{new Date(r.payable_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
        {showUpi && <td>{r.profiles?.upi_id ?? <span className="muted">not set</span>}</td>}
        {r.status === "requested" && <td><PayoutActions id={r.id} /></td>}
        {r.status === "paid" && <td className="muted">UTR: {r.payout_utr}</td>}
        {r.status === "pending" && <td className="muted">unlocks {r.payable_on === today ? "today" : "later"}</td>}
      </tr>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 6 }}>Referral Payouts</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Rewards unlock on the 5th of the month after the referred customer's payment is approved.
        Customers then request a payout — pay them by UPI and mark it paid with the UTR.
      </p>

      <div className="stat-grid">
        <div className="stat-card"><div className="num">{requested.length}</div><div className="label">Requested — needs payout</div></div>
        <div className="stat-card"><div className="num">₹{requestedTotal.toLocaleString("en-IN")}</div><div className="label">To pay by UPI</div></div>
        <div className="stat-card"><div className="num">{upcoming.length}</div><div className="label">Not yet unlocked</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>Requested — pay now</div>
        <table>
          <thead><tr><th>Referrer</th><th>Plan</th><th>Amount</th><th>Unlocked on</th><th>UPI ID</th><th></th></tr></thead>
          <tbody>
            {requested.map((r: any) => <Row key={r.id} r={r} showUpi />)}
            {!requested.length && <tr><td colSpan={6} className="muted">No pending payout requests.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>Not yet unlocked</div>
        <table>
          <thead><tr><th>Referrer</th><th>Plan</th><th>Amount</th><th>Unlocks on</th><th></th></tr></thead>
          <tbody>
            {upcoming.map((r: any) => <Row key={r.id} r={r} />)}
            {!upcoming.length && <tr><td colSpan={5} className="muted">Nothing pending.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>Paid</div>
        <table>
          <thead><tr><th>Referrer</th><th>Plan</th><th>Amount</th><th>Unlocked on</th><th></th></tr></thead>
          <tbody>
            {paid.map((r: any) => <Row key={r.id} r={r} />)}
            {!paid.length && <tr><td colSpan={5} className="muted">No payouts made yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
