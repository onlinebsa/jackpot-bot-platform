"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Reset your password</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        <Link href="/login">Back to login</Link>
      </p>
      <div className="card">
        {sent ? (
          <p>Check your email for a reset link, then set a new password.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn" style={{ width: "100%" }}>Send reset link</button>
          </form>
        )}
      </div>
    </div>
  );
}
