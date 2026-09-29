import { createAdminClient } from "@/lib/supabase/admin";
import { createPromoCode } from "./actions";

export default async function PromoCodesPage() {
  const supabase = createAdminClient();
  const { data: codes } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
  const now = new Date();

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Promo Codes</h1>

      <form action={createPromoCode} className="card" style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Code</label>
          <input name="code" required placeholder="e.g. DIWALI20" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Discount %</label>
          <input name="discount" type="number" min={1} max={100} required style={{ width: 90 }} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Expiry date (optional)</label>
          <input name="expires" type="date" />
        </div>
        <button className="btn">Generate</button>
      </form>

      <div className="card">
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Times used</th><th>Expires</th><th>Created</th></tr></thead>
          <tbody>
            {(codes ?? []).map((c) => {
              const expired = c.expires_at && new Date(c.expires_at) < now;
              return (
                <tr key={c.id}>
                  <td>{c.code}</td>
                  <td>{c.discount_percent}%</td>
                  <td>{c.usage_count}</td>
                  <td>
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : <span className="muted">Never</span>}
                    {expired && <span className="badge badge-rejected" style={{ marginLeft: 8 }}>expired</span>}
                  </td>
                  <td className="muted">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {!codes?.length && <tr><td colSpan={5} className="muted">No promo codes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
