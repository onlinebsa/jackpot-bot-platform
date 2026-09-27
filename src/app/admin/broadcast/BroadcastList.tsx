"use client";

import { useState } from "react";

type Customer = { id: string; full_name: string; whatsapp_number: string };

export function BroadcastList({ customers }: { customers: Customer[] }) {
  const [message, setMessage] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  function send(c: Customer) {
    const text = encodeURIComponent(message.replace("{name}", c.full_name));
    window.open(`https://wa.me/${c.whatsapp_number.replace(/\D/g, "")}?text=${text}`, "_blank");
    setSentIds((s) => new Set(s).add(c.id));
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Message (use {"{name}"} to personalize)</label>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <p className="muted">{customers.length} customer(s) match this segment.</p>
      </div>

      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>WhatsApp</th><th></th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.full_name}</td>
                <td className="muted">{c.whatsapp_number}</td>
                <td>
                  <button className="btn-secondary btn-sm" disabled={!message} onClick={() => send(c)}>
                    {sentIds.has(c.id) ? "Sent ✓ (resend)" : "Send"}
                  </button>
                </td>
              </tr>
            ))}
            {!customers.length && <tr><td colSpan={3} className="muted">No customers in this segment.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
