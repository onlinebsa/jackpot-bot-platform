import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentRowActions } from "./PaymentRowActions";
import { ExportCsvButton } from "@/components/ExportCsvButton";

export default async function AdminPaymentsPage() {
  const supabase = createAdminClient();
  const { data: payments, error } = await supabase
    .from("payments")
    .select("*, profiles!payments_user_id_fkey(full_name, username)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Payment Approvals</h1>
      {error && (
        <pre style={{ background: "#fee", color: "#900", padding: 12, marginBottom: 16, whiteSpace: "pre-wrap" }}>
          DEBUG ERROR: {JSON.stringify(error, null, 2)}
        </pre>
      )}
      <ExportCsvButton basePath="/admin/export/payments" />
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Plan</th><th>Amount</th><th>Promo</th><th>UTR</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {(payments ?? []).map((p: any) => (
              <tr key={p.id}>
                <td>{p.profiles?.full_name}<div className="muted" style={{ fontSize: 12 }}>@{p.profiles?.username}</div></td>
                <td>{p.plan}</td>
                <td>₹{p.amount}</td>
                <td className="muted">{p.promo_code ?? "—"}</td>
                <td className="muted">{p.utr ?? "—"}</td>
                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                <td>
                  <PaymentRowActions
                    paymentId={p.id}
                    screenshotPath={p.screenshot_url}
                    status={p.status}
                    tvGranted={p.tv_access_granted}
                    tvUsername={p.tradingview_username}
                  />
                </td>
              </tr>
            ))}
            {!payments?.length && <tr><td colSpan={7} className="muted">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}