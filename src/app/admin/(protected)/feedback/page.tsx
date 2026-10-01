import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminFeedbackPage() {
  const supabase = createAdminClient();

  const { data: feedback, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="wrap"><p className="muted">Could not load feedback: {error.message}</p></div>;
  }

  const withUrls = await Promise.all(
    (feedback || []).map(async (f) => {
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
        What customers are saying, with profit screenshots where attached.
      </p>

      {withUrls.length === 0 ? (
        <p className="muted">No feedback submitted yet.</p>
      ) : (
        withUrls.map((f) => (
          <div
            key={f.id}
            className="card"
            style={{ marginBottom: 16, padding: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <strong>{f.customer_name}</strong>
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