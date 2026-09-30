import { createAdminClient } from "@/lib/supabase/admin";
import { RevenueChart } from "./RevenueChart";
import { ReminderButton } from "./ReminderButton";

export default async function SalesDashboardPage() {
  const supabase = createAdminClient();

  const [{ count: totalActive }, { count: onetimeCount }, { count: monthlyCount }, { data: approvedPayments }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active").eq("plan", "onetime"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active").eq("plan", "monthly"),
      supabase.from("payments").select("amount, created_at").eq("status", "approved"),
    ]);

  const totalRevenue = (approvedPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  // Daily revenue, last 7 days
  const daily = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const value = (approvedPayments ?? [])
      .filter((p) => new Date(p.created_at).toDateString() === d.toDateString())
      .reduce((s, p) => s + Number(p.amount), 0);
    return { label, value };
  });

  // Monthly revenue, last 6 months
  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const value = (approvedPayments ?? [])
      .filter((p) => {
        const pd = new Date(p.created_at);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      })
      .reduce((s, p) => s + Number(p.amount), 0);
    return { label, value };
  });

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const { data: expiring } = await supabase
    .from("profiles")
    .select("id, full_name, whatsapp_number, plan_expiry")
    .eq("status", "active")
    .lte("plan_expiry", in7Days.toISOString())
    .gte("plan_expiry", new Date().toISOString())
    .order("plan_expiry", { ascending: true });

  const expiringIds = (expiring ?? []).map((e) => e.id);
  const { data: reminderLogs } = expiringIds.length
    ? await supabase.from("reminder_logs").select("user_id").in("user_id", expiringIds)
    : { data: [] as { user_id: string }[] };
  const remindedSet = new Set((reminderLogs ?? []).map((r) => r.user_id));

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Sales Dashboard</h1>

      <div className="stat-grid">
        <div className="stat-card"><div className="num">{totalActive ?? 0}</div><div className="label">Total subscribers</div></div>
        <div className="stat-card"><div className="num">{onetimeCount ?? 0}</div><div className="label">2 Year Pro Plan subscribers</div></div>
        <div className="stat-card"><div className="num">{monthlyCount ?? 0}</div><div className="label">Starter Monthly Plan subscribers</div></div>
        <div className="stat-card"><div className="num">₹{totalRevenue.toLocaleString("en-IN")}</div><div className="label">Total revenue</div></div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <RevenueChart daily={daily} monthly={monthly} />
      </div>

      <div className="card">
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>
          Expiring within 7 days
        </div>
        {!expiring?.length && <p className="muted">No customers expiring soon.</p>}
        {!!expiring?.length && (
          <table>
            <thead><tr><th>Name</th><th>Expiry</th><th></th></tr></thead>
            <tbody>
              {expiring.map((e) => (
                <tr key={e.id}>
                  <td>{e.full_name}</td>
                  <td className="muted">{new Date(e.plan_expiry).toLocaleDateString()}</td>
                  <td>
                    <ReminderButton
                      userId={e.id}
                      whatsapp={e.whatsapp_number}
                      name={e.full_name}
                      sent={remindedSet.has(e.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
