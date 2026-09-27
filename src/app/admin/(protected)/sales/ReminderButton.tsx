"use client";

import { useState } from "react";
import { logReminderSent } from "./actions";

export function ReminderButton({ userId, whatsapp, name, sent }: { userId: string; whatsapp: string; name: string; sent: boolean }) {
  const [done, setDone] = useState(sent);

  function handleClick() {
    const text = encodeURIComponent(`Hi ${name}, your Jackpot Bot plan is expiring soon. Renew now to keep your access active!`);
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${text}`, "_blank");
    logReminderSent(userId).then(() => setDone(true));
  }

  return (
    <button className="btn-secondary btn-sm" onClick={handleClick}>
      {done ? "Reminder sent ✓ (send again)" : "Send reminder"}
    </button>
  );
}
