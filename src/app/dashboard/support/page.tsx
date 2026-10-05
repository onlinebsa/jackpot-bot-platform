"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Reply = { id: string; sender: string; message: string; created_at: string };
type Ticket = { id: string; subject: string; message: string; status: string; created_at: string; replies: Reply[] };

export default function SupportPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ticketRows } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const withReplies = await Promise.all(
      (ticketRows ?? []).map(async (t) => {
        const { data: replies } = await supabase
          .from("ticket_replies")
          .select("*")
          .eq("ticket_id", t.id)
          .order("created_at", { ascending: true });
        return { ...t, replies: replies ?? [] };
      })
    );
    setTickets(withReplies);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !message) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("support_tickets").insert({ user_id: user!.id, subject, message });
    setSubject("");
    setMessage("");
    setLoading(false);
    load();
  }

  async function handleReply(ticketId: string) {
    const text = (replyText[ticketId] || "").trim();
    if (!text) return;
    setReplyLoading((s) => ({ ...s, [ticketId]: true }));
    await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      sender: "customer",
      message: text,
    });
    setReplyText((s) => ({ ...s, [ticketId]: "" }));
    setReplyLoading((s) => ({ ...s, [ticketId]: false }));
    load();
  }

  return (
    <div className="wrap">
      <p style={{ marginBottom: 20 }}><Link href="/dashboard" className="muted">← Back to dashboard</Link></p>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Support</h1>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 10 }}>Raise a new ticket</h3>
        <div className="field">
          <label>Subject</label>
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <button className="btn" disabled={loading}>{loading ? "Sending…" : "Submit ticket"}</button>
      </form>

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Your tickets</h3>
      {!tickets.length && <p className="muted">No tickets yet.</p>}
      {tickets.map((t) => (
        <div className="card" key={t.id} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{t.subject}</strong>
            <span className={`badge badge-${t.status}`}>{t.status}</span>
          </div>
          <p className="muted" style={{ marginTop: 6, marginBottom: 12 }}>{t.message}</p>

          {!!t.replies.length && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {t.replies.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: r.sender === "admin" ? "var(--surface, #111820)" : "var(--bg, #0B0F14)",
                    border: "1px solid var(--border, #22303C)",
                    borderRadius: 4,
                    padding: 10,
                  }}
                >
                  <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
                    {r.sender === "admin" ? "Support team" : "You"} · {new Date(r.created_at).toLocaleString()}
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5 }}>{r.message}</p>
                </div>
              ))}
            </div>
          )}

          {t.status !== "resolved" && (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Type a reply..."
                value={replyText[t.id] || ""}
                onChange={(e) => setReplyText((s) => ({ ...s, [t.id]: e.target.value }))}
                style={{ flex: 1 }}
              />
              <button
                className="btn-secondary btn-sm"
                onClick={() => handleReply(t.id)}
                disabled={replyLoading[t.id]}
              >
                {replyLoading[t.id] ? "Sending…" : "Reply"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
