"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    async function establishSession() {
      // Newer Supabase auth links use a PKCE "code" query param that must be
      // exchanged for a session before updateUser() will work.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setSessionError("This reset link is invalid or has expired. Please request a new one.");
          setReady(true);
          return;
        }
      }

      // Older/implicit-flow links put the tokens in the URL hash, which the
      // Supabase client picks up automatically — just confirm a session exists.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setSessionError("This reset link is invalid or has expired. Please request a new one.");
      }
      setReady(true);
    }
    establishSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6 || password.length > 12) {
      setError("Password must be 6–12 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Set a new password</h1>
      <div className="card">
        {!ready && <p className="muted">Verifying your reset link…</p>}
        {ready && sessionError && (
          <div>
            <p className="error" style={{ marginBottom: 12 }}>{sessionError}</p>
            <a href="/forgot-password" className="btn" style={{ display: "inline-block" }}>Request a new link</a>
          </div>
        )}
        {ready && !sessionError && (
          done ? (
            <p>Password updated. Redirecting to login…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>New password</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
              <button className="btn" style={{ width: "100%" }}>Update password</button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
