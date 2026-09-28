"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getAdminNotifications, markAdminNotificationRead, markAllAdminNotificationsRead } from "./notificationsActions";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await getAdminNotifications();
      setNotifications(data as NotificationItem[]);
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 18000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleItemClick(n: NotificationItem) {
    if (!n.is_read) {
      setNotifications((cur) => cur.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      try {
        await markAdminNotificationRead(n.id);
      } catch {}
    }
    setOpen(false);
  }

  async function handleMarkAllRead() {
    setNotifications((cur) => cur.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllAdminNotificationsRead();
    } catch {}
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "8px 10px",
          cursor: "pointer",
          color: "var(--text)",
          fontSize: 16,
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#e5484d",
              color: "#fff",
              borderRadius: "999px",
              fontSize: 11,
              lineHeight: 1,
              padding: "3px 6px",
              fontWeight: 700,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            background: "#16181d",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: "var(--muted)" }}>No notifications yet.</div>
          )}
          {notifications.map((n) => {
            const inner = (
              <div
                onClick={() => handleItemClick(n)}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    marginTop: 5,
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    flexShrink: 0,
                    background: n.is_read ? "#2fbf71" : "#e5484d",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n.title}</div>
                  {n.message && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{n.message}</div>}
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}