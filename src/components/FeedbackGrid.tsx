"use client";

import { useState } from "react";

type FeedbackItem = {
  id: string;
  customer_name: string;
  feedback_text: string;
  rating: number | null;
  created_at: string;
  screenshotUrl: string | null;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ color: "#FBBF24", fontSize: 16, letterSpacing: 2 }}>
      {"★".repeat(rating)}
      <span style={{ color: "#444" }}>{"★".repeat(5 - rating)}</span>
    </div>
  );
}

export function FeedbackGrid({ items }: { items: FeedbackItem[] }) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  if (!items.length) return null;

  return (
    <div style={{ marginTop: 50 }}>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>What our customers say</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((f) => (
          <div
            key={f.id}
            style={{
              background: "#ffffff",
              color: "#111111",
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{f.customer_name}</strong>
              <span style={{ fontSize: 11, color: "#777" }}>
                {new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <Stars rating={f.rating ?? 5} />
            <p style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 8, color: "#222" }}>{f.feedback_text}</p>
            {f.screenshotUrl && (
              <img
                src={f.screenshotUrl}
                alt="Profit screenshot"
                onClick={() => setZoomUrl(f.screenshotUrl)}
                style={{
                  marginTop: 10,
                  width: 90,
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 6,
                  cursor: "zoom-in",
                  border: "1px solid #ddd",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {zoomUrl && (
        <div
          onClick={() => setZoomUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: 20,
          }}
        >
          <img
            src={zoomUrl}
            alt="Profit screenshot zoomed"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}