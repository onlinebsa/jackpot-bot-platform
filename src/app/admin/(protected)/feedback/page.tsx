import { createAdminClient } from "@/lib/supabase/admin";

const RATING_COLOR: Record<number, string> = {
  5: "#3FB68B",
  4: "#7FD858",
  3: "#F5A623",
  2: "#F2994A",
  1: "#E5484D",
};

export default async function AdminFeedbackPage() {
  const supabase = createAdminClient();

  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="wrap"><p className="muted">Could not load feedback: {error.message}</p></div>;
  }

  const all = feedback || [];
  const totalReviews = all.length;
  const avgRating = totalReviews
    ? (all.reduce((sum, f) => sum + (f.rating || 0), 0) / totalReviews).toFixed(1)
    : "—";
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  all.forEach((f) => {
    if (f.rating >= 1 && f.rating <= 5) counts[f.rating]++;
  });

  // Donut chart math (SVG stroke-dasharray trick)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;
  const donutSegments = [5, 4, 3, 2, 1].map((n) => {
    const pct = totalReviews ? counts[n] / totalReviews : 0;
    const segment = {
      rating: n,
      color: RATING_COLOR[n],
      dasharray: `${pct * circumference} ${circumference}`,
      dashoffset: -offsetAcc,
      pct: Math.round(pct * 100),
    };
    offsetAcc += pct * circumference;
    return segment;
  });

  // Reviews over last 14 days (bar chart)
  const days: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const count = all.filter((f) => f.created_at?.slice(0, 10) === dayStr).length;
    days.push({ label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count });
  }
  const maxDayCount = Math.max(1, ...days.map((d) => d.count));

  const withUrls = await Promise.all(
    all.map(async (f) => {
      let screenshotUrl: string | null = null;
      if (f.screenshot_path) {
        const { data } = await supabase.storage
          .from("feedback-screenshots")
          .createSignedUrl(f.screenshot_path, 60 * 60);
        screenshotUrl = data?.signedUrl || null;
      }
      return { ...f, screenshotUrl };
    })
  );

  return (
    <div className="wrap-wide">
      <h2>Customer feedback</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        What customers are saying, with ratings and profit screenshots where attached.
      </p>

      {/* Top stat cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="card" style={{ padding: 16, minWidth: 140 }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{totalReviews}</div>
          <div className="muted" style={{ fontSize: 12 }}>Total reviews</div>
        </div>
        <div className="card" style={{ padding: 16, minWidth: 140 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#F5A623" }}>
            {avgRating} <span style={{ fontSize: 15 }}>★</span>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Average rating</div>
        </div>
        {[5, 4, 3, 2, 1].map((n) => (
          <div key={n} className="card" style={{ padding: 16, minWidth: 90, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: RATING_COLOR[n] }}>{counts[n]}</div>
            <div className="muted" style={{ fontSize: 11 }}>{n} ★</div>
          </div>
        ))}
      </div>

      {/* Donut chart + bar chart side by side */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        {/* Donut */}
        <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <g transform="translate(70,70) rotate(-90)">
              <circle r={radius} cx="0" cy="0" fill="none" stroke="var(--border, #22303C)" strokeWidth="18" />
              {donutSegments.map((seg) =>
                seg.pct > 0 ? (
                  <circle
                    key={seg.rating}
                    r={radius}
                    cx="0"
                    cy="0"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={seg.dasharray}
                    strokeDashoffset={seg.dashoffset}
                  />
                ) : null
              )}
            </g>
            <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
              {avgRating}
            </text>
            <text x="70" y="82" textAnchor="middle" fontSize="11" fill="var(--muted, #8393A2)">
              avg rating
            </text>
          </svg>
          <div>
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: RATING_COLOR[n], display: "inline-block" }} />
                <span>{n} ★ — {counts[n]} ({totalReviews ? Math.round((counts[n] / totalReviews) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart: reviews per day, last 14 days */}
        <div className="card" style={{ padding: 20, flex: 1, minWidth: 320 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>Reviews — last 14 days</div>
          <svg viewBox="0 0 420 140" style={{ width: "100%", height: "auto" }}>
            {days.map((d, i) => {
              const barW = 420 / days.length - 6;
              const x = i * (420 / days.length) + 3;
              const h = (d.count / maxDayCount) * 100;
              const y = 110 - h;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={barW} height={h} rx="2" fill="#F5A623" />
                  {d.count > 0 && (
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="currentColor">
                      {d.count}
                    </text>
                  )}
                  <text x={x + barW / 2} y="124" textAnchor="middle" fontSize="8.5" fill="var(--muted, #8393A2)">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Individual reviews */}
      {withUrls.length === 0 ? (
        <p className="muted">No feedback submitted yet.</p>
      ) : (
        withUrls.map((f) => (
          <div
            key={f.id}
            className="card"
            style={{ marginBottom: 16, padding: 16, borderLeft: `4px solid ${RATING_COLOR[f.rating] || "#555"}` }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <strong>{f.customer_name}</strong>{" "}
                <span style={{ color: RATING_COLOR[f.rating] || "#555", fontSize: 13 }}>
                  {"★".repeat(f.rating || 0)}
                  <span style={{ color: "#555" }}>{"★".repeat(5 - (f.rating || 0))}</span>
                </span>
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {new Date(f.created_at).toLocaleString("en-IN")}
              </span>
            </div>
            <p style={{ marginBottom: f.screenshotUrl ? 12 : 0 }}>{f.feedback_text}</p>
            {f.screenshotUrl && (
              <a href={f.screenshotUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={f.screenshotUrl}
                  alt="Profit screenshot"
                  style={{ maxWidth: 280, borderRadius: 4, border: "1px solid var(--border, #22303C)" }}
                />
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}
