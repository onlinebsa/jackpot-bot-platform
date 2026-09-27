import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCustomersPage() {
  const supabase = createAdminClient();
  const { data: customers } = await supabase
    .from("profiles")
    .select("id, full_name, username, plan, status, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Customers</h1>
      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Username</th><th>Plan</th><th>Status</th><th>Joined</th><th></th></tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id}>
                <td>{c.full_name}</td>
                <td>{c.username}</td>
                <td>{c.plan ?? "—"}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status.replace("_", " ")}</span></td>
                <td className="muted">{new Date(c.created_at).toLocaleDateString()}</td>
                <td><Link href={`/admin/customers/${c.id}`} className="muted">View →</Link></td>
              </tr>
            ))}
            {!customers?.length && (
              <tr><td colSpan={6} className="muted">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
