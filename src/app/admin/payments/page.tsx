import { createClient } from "@/lib/supabase/server";
import { PaymentRowActions } from "./PaymentRowActions";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles(full_name, username)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Payment Approvals</h1>
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
                  {p.status === "pending" && (
                    <PaymentRowActions paymentId={p.id} screenshotPath={p.screenshot_url} />
                  )}
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
