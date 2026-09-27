import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerActions } from "./CustomerActions";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: c } = await supabase.from("profiles").select("*").eq("id", id).single();
  const { data: payments } = await supabase
    .from("payments").select("*").eq("user_id", id).order("created_at", { ascending: false });

  if (!c) return <p>Customer not found.</p>;

  const rows: [string, string][] = [
    ["Username", c.username],
    ["Full name", c.full_name],
    ["Email", c.email],
    ["WhatsApp", c.whatsapp_number],
    ["Calling number", c.calling_number],
    ["TradingView username", c.tradingview_username],
    ["How they heard about us", c.heard_from],
    ["Referral code", c.referral_code ?? "—"],
    ["Trading experience", c.trading_experience],
    ["Markets traded", (c.markets_traded ?? []).join(", ")],
    ["Profession", c.profession],
    ["Failed login attempts", String(c.failed_login_count)],
    ["Joined", new Date(c.created_at).toLocaleString()],
  ];

  return (
    <div>
      <p style={{ marginBottom: 16 }}><Link href="/admin/customers" className="muted">← Back to customers</Link></p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>{c.full_name}</h1>
        <span className={`badge badge-${c.status}`}>{c.status.replace("_", " ")}</span>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <CustomerActions userId={c.id} whatsapp={c.whatsapp_number} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <table>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}><th style={{ width: 220 }}>{label}</th><td>{value}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>Payment history</div>
        {!payments?.length && <p className="muted">No payments yet.</p>}
        {!!payments?.length && (
          <table>
            <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>UTR</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{p.plan}</td>
                  <td>₹{p.amount}</td>
                  <td className="muted">{p.utr ?? "—"}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
