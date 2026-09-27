"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Ticket = { id: string; subject: string; message: string; status: string; created_at: string };

export default function SupportPage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
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
        <div className="card" key={t.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{t.subject}</strong>
            <span className={`badge badge-${t.status}`}>{t.status}</span>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>{t.message}</p>
        </div>
      ))}
    </div>
  );
}
