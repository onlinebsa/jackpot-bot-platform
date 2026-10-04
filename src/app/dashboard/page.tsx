import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { ReferralCard } from "@/components/ReferralCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const status = profile?.status ?? "no_plan";

  const { data: referrals } = await supabase.rpc("get_my_referrals");

  return (
    <div className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <img src="/logo.png" alt="Jackpot Bot" style={{ height: 40, width: "auto" }} />
        <LogoutButton />
      </div>

      <h1 style={{ fontSize: 20, marginBottom: 24 }}>Hi, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 6 }}>Your plan</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>
          {profile?.plan && <span className="muted">{profile.plan === "monthly" ? "Starter Monthly Plan" : "2 Year Pro Plan"}</span>}
        </div>
        {profile?.plan_expiry && (
          <div className="muted" style={{ fontSize: 13 }}>
            Expires: {new Date(profile.plan_expiry).toLocaleDateString()}
          </div>
        )}
        {status !== "active" && (
          <Link href="/dashboard/payment" className="btn" style={{ display: "inline-block", marginTop: 14 }}>
            {status === "no_plan" ? "Choose a plan" : "Renew now"}
          </Link>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>Payment history</div>
        {!payments?.length && <p className="muted">No payments submitted yet.</p>}
        {!!payments?.length && (
          <table>
            <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{p.plan}</td>
                  <td>₹{p.amount}</td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td>
                    {p.status === "approved" && p.invoice_number && (
                      <Link href={`/dashboard/invoice/${p.id}`} className="muted">Invoice →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ReferralCard
        code={profile?.own_referral_code ?? ""}
        upiId={profile?.upi_id ?? ""}
        referrals={referrals ?? []}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/dashboard/support" className="btn-secondary" style={{ display: "inline-block" }}>
          Support
        </Link>
        <Link href="/dashboard/feedback" className="btn-secondary" style={{ display: "inline-block" }}>
          Feedback
        </Link>
      </div>
    </div>
  );
}