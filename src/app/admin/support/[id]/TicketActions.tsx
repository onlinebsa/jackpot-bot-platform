"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyToTicket, resolveTicket } from "../actions";

export function TicketActions({ ticketId, whatsapp, status }: { ticketId: string; whatsapp: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    await replyToTicket(ticketId, message);
    setMessage("");
    setLoading(false);
    router.refresh();
  }

  async function handleResolve() {
    await resolveTicket(ticketId);
    router.refresh();
  }

  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message || "Hi, regarding your support ticket:")}`;

  return (
    <div>
      <form onSubmit={handleReply} className="field">
        <label>Reply</label>
        <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn btn-sm" disabled={loading}>{loading ? "Sending…" : "Send reply"}</button>
          <a href={waLink} target="_blank" className="btn-secondary btn-sm">Reply on WhatsApp</a>
          {status !== "resolved" && (
            <button type="button" className="btn-secondary btn-sm" onClick={handleResolve}>Mark resolved</button>
          )}
        </div>
      </form>
    </div>
  );
}
