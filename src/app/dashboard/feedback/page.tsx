"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) setName(profile.full_name);
    })();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim() || !text.trim()) {
      setError("Please enter your name and feedback.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in.");
        setSubmitting(false);
        return;
      }

      let screenshotPath: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("feedback-screenshots")
          .upload(path, file);
        if (uploadError) throw uploadError;
        screenshotPath = path;
      }

      const { error: insertError } = await supabase.from("feedback").insert({
        user_id: user.id,
        customer_name: name.trim(),
        feedback_text: text.trim(),
        rating,
        screenshot_path: screenshotPath,
      });
      if (insertError) throw insertError;

      setMessage("Thank you! Your feedback has been submitted.");
      setText("");
      setFile(null);
      setRating(5);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap">
      <h2>Share your feedback</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Tell us how Jackpot Bot is working for you — you can also attach a profit screenshot.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Your name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>

        <div className="field">
          <label>Your rating *</label>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  cursor: "pointer",
                  fontSize: 28,
                  lineHeight: 1,
                  color: (hoverRating || rating) >= n ? "#FBBF24" : "#555",
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Your feedback *</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How is Jackpot Bot working for you?"
            rows={5}
            style={{
              width: "100%",
              background: "var(--surface, #111820)",
              border: "1px solid var(--border, #22303C)",
              color: "inherit",
              padding: "9px 10px",
              borderRadius: 3,
              fontSize: 13.5,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div className="field">
          <label>Attach profit screenshot (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && <p style={{ color: "#E5484D", fontSize: 13 }}>{error}</p>}
        {message && <p style={{ color: "#3FB68B", fontSize: 13 }}>{message}</p>}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
    </div>
  );
}