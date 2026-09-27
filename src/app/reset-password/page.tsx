"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
        {done ? (
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
        )}
      </div>
    </div>
  );
}
