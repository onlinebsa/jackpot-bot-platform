"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let email = identifier;
    if (!identifier.includes("@")) {
      const { data, error: lookupError } = await supabase.rpc("get_email_by_username", {
        p_username: identifier,
      });
      if (lookupError || !data) {
        setLoading(false);
        setError("No account found with that username.");
        return;
      }
      email = data;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      await supabase.rpc("increment_failed_login", { p_username: identifier });
      setLoading(false);
      setError("Invalid username/email or password.");
      return;
    }

    // route by role
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user?.id)
      .single();

    setLoading(false);
    router.push(profile?.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Log in</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        New here? <Link href="/signup">Create an account</Link>
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Username or Email</label>
          <input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <button className="btn" style={{ width: "100%", marginBottom: 12 }} disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
        <p style={{ textAlign: "center" }}>
          <Link href="/forgot-password" className="muted">Forgot password?</Link>
        </p>
      </form>
    </div>
  );
}
