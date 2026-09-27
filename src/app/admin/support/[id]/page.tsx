import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TicketActions } from "./TicketActions";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from("support_tickets").select("*, profiles(full_name, whatsapp_number)").eq("id", id).single();
  const { data: replies } = await supabase
    .from("ticket_replies").select("*").eq("ticket_id", id).order("created_at", { ascending: true });

  if (!ticket) return <p>Ticket not found.</p>;

  return (
    <div>
      <p style={{ marginBottom: 16 }}><Link href="/admin/support" className="muted">← Back to tickets</Link></p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>{ticket.subject}</h1>
        <span className={`badge badge-${ticket.status}`}>{ticket.status}</span>
      </div>
      <p className="muted" style={{ marginBottom: 20 }}>From: {ticket.profiles?.full_name}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <p>{ticket.message}</p>
      </div>

      {!!replies?.length && (
        <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {replies.map((r) => (
            <div key={r.id} className="card" style={{ background: r.sender === "admin" ? "var(--surface)" : "var(--bg)" }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                {r.sender === "admin" ? "You" : "Customer"} · {new Date(r.created_at).toLocaleString()}
              </div>
              <p>{r.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <TicketActions ticketId={ticket.id} whatsapp={ticket.profiles?.whatsapp_number ?? ""} status={ticket.status} />
      </div>
    </div>
  );
}
