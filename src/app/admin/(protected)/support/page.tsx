import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSupportPage() {
  const supabase = createAdminClient();
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*, profiles(full_name, username)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Support Tickets</h1>
      <div className="card">
        <table>
          <thead><tr><th>Customer</th><th>Subject</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {(tickets ?? []).map((t: any) => (
              <tr key={t.id}>
                <td>{t.profiles?.full_name}</td>
                <td>{t.subject}</td>
                <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                <td className="muted">{new Date(t.created_at).toLocaleDateString()}</td>
                <td><Link href={`/admin/support/${t.id}`} className="muted">Open →</Link></td>
              </tr>
            ))}
            {!tickets?.length && <tr><td colSpan={5} className="muted">No tickets yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
