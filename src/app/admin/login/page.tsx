"use client";

import { useState } from "react";
import { adminLogin } from "./actions";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await adminLogin(formData);
      // adminLogin redirects on success, so we only get here on failure
      if (result?.error) setError(result.error);
    } catch (err: any) {
      // NEXT_REDIRECT throws internally on success — ignore that, only show real errors
      if (!String(err?.digest || "").startsWith("NEXT_REDIRECT")) {
        setError("Something went wrong. Please try again.");
      } else {
        throw err;
      }
    }
    setLoading(false);
  }

  return (
    <div className="wrap">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Admin Login</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Staff access only.</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label>Admin username</label>
          <input required name="username" autoComplete="username" />
        </div>
        <div className="field">
          <label>Admin password</label>
          <input required name="password" type="password" autoComplete="current-password" />
        </div>
        {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}
        <button className="btn" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
