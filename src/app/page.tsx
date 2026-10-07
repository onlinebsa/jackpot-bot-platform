import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeedbackGrid } from "@/components/FeedbackGrid";

export default async function Home() {
  const supabase = createAdminClient();
  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, customer_name, feedback_text, rating, screenshot_path, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const items = await Promise.all(
    (feedback ?? []).map(async (f) => {
      let screenshotUrl: string | null = null;
      if (f.screenshot_path) {
        const { data } = await supabase.storage
          .from("feedback-screenshots")
          .createSignedUrl(f.screenshot_path, 60 * 60 * 24);
        screenshotUrl = data?.signedUrl ?? null;
      }
      return {
        id: f.id,
        customer_name: f.customer_name,
        feedback_text: f.feedback_text,
        rating: f.rating,
        created_at: f.created_at,
        screenshotUrl,
      };
    })
  );

  const { data: settings } = await supabase
    .from("admin_settings")
    .select("link_youtube, link_instagram, link_facebook")
    .eq("id", 1)
    .single();

  const socialLinks = [
    {
      name: "YouTube",
      url: settings?.link_youtube,
      color: "#FF0000",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/>
        </svg>
      ),
    },
    {
      name: "Instagram",
      url: settings?.link_instagram,
      color: "#E1306C",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 2.1.26 2.6.46.7.26 1.2.6 1.7 1.1.5.5.9 1 1.1 1.7.2.5.4 1.4.5 2.6.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.26 2.1-.46 2.6-.26.7-.6 1.2-1.1 1.7-.5.5-1 .9-1.7 1.1-.5.2-1.4.4-2.6.5-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-2.1-.26-2.6-.46a4.6 4.6 0 0 1-1.7-1.1 4.6 4.6 0 0 1-1.1-1.7c-.2-.5-.4-1.4-.5-2.6C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.26-2.1.46-2.6.26-.7.6-1.2 1.1-1.7.5-.5 1-.9 1.7-1.1.5-.2 1.4-.4 2.6-.5C8.4 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.8.07-1 .05-1.6.22-1.9.37-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.15.4-.32.9-.37 1.9C2.8 8.5 2.8 8.9 2.8 12s0 3.5.07 4.8c.05 1 .22 1.6.37 1.9.2.5.4.8.8 1.2.4.4.7.6 1.2.8.4.15.9.32 1.9.37 1.3.06 1.7.07 4.8.07s3.5 0 4.8-.07c1-.05 1.6-.22 1.9-.37.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.15-.4.32-.9.37-1.9.06-1.3.07-1.7.07-4.8s0-3.5-.07-4.8c-.05-1-.22-1.6-.37-1.9-.2-.5-.4-.8-.8-1.2a3 3 0 0 0-1.2-.8c-.4-.15-.9-.32-1.9-.37C15.5 4 15.1 4 12 4Zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5.9-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"/>
        </svg>
      ),
    },
    {
      name: "Facebook",
      url: settings?.link_facebook,
      color: "#1877F2",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/>
        </svg>
      ),
    },
  ].filter((s) => s.url);

  return (
    <div className="wrap-wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <img src="/logo.png" alt="Jackpot Bot" style={{ height: 56, width: "auto" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login" className="btn-secondary">Login</Link>
          <Link href="/signup" className="btn">Sign up</Link>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--amber)", fontWeight: 700, marginBottom: 10 }}>
          Jackpot Bot &amp; Algo
        </div>
        <h1 style={{ fontSize: 34, margin: "0 0 12px" }}>Simple, Transparent Pricing</h1>
        <p className="muted" style={{ fontSize: 15, maxWidth: 480, margin: "0 auto 22px", lineHeight: 1.5 }}>
          Choose the plan that fits your trading style — and scale up as a professional trader.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <span className="card" style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 20 }}>📈 All markets &amp; all time frames tested</span>
          <span className="card" style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 20 }}>⚡ Quick Execution</span>
          <span className="card" style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 20 }}>🇮🇳 Fast Servers</span>
          <span className="card" style={{ padding: "7px 14px", fontSize: 12.5, borderRadius: 20 }}>🛑 Kill-Switch Option</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ borderColor: "#2DD4BF", boxShadow: "0 0 30px -10px rgba(45,212,191,0.3)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "#2DD4BF", textTransform: "uppercase", fontSize: 11, fontWeight: 700, background: "#0F3F3A", padding: "3px 9px", borderRadius: 4 }}>
              Limited-Time Offer
            </span>
            <span style={{ background: "#2DD4BF", color: "#06231F", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 4 }}>
              67% OFF
            </span>
          </div>
          <h3 style={{ fontSize: 20, margin: "8px 0 2px" }}>JB Starter</h3>
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Duration: 1 Month</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ textDecoration: "line-through", color: "var(--muted)", marginRight: 8 }}>₹15,000</span>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>₹5,000</span>
            <span className="muted"> /month</span>
          </div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
            Limited-time price — reverts to MRP ₹15,000 after the offer ends.
          </p>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 16, lineHeight: 1.8 }}>
            <li>1-month Jackpot Bot Indicator access</li>
            <li>Setup &amp; deploy on TradingView</li>
            <li>Support for any issue (9:30 am – 5 pm)</li>
            <li>Raise support tickets directly from your dashboard</li>
            <li>Premium VIP Group — 1 month access</li>
            <li>Free training / demo class</li>
            <li><strong style={{ color: "var(--text)" }}>Bonus:</strong> Telegram Trading Bot — automatically places trades from your signals (T&amp;C apply)</li>
          </ul>
          <Link href="/signup?plan=monthly" className="btn" style={{ display: "block", textAlign: "center", background: "#2DD4BF", color: "#06231F" }}>
            Choose JB Starter
          </Link>
        </div>

        <div className="card" style={{ borderColor: "var(--amber)", boxShadow: "0 0 30px -10px rgba(245,166,35,0.35)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "var(--amber)", textTransform: "uppercase", fontSize: 11, fontWeight: 700, background: "#3A2E10", padding: "3px 9px", borderRadius: 4 }}>
              Best Value
            </span>
            <span style={{ background: "var(--amber)", color: "#1A1200", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 4 }}>
              70% OFF
            </span>
          </div>
          <h3 style={{ fontSize: 20, margin: "8px 0 2px" }}>JB Elite Pro</h3>
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Duration: 2 Years</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ textDecoration: "line-through", color: "var(--muted)", marginRight: 8 }}>₹2,00,000</span>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>₹60,000</span>
          </div>
          <p className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
            Limited-time price — reverts to MRP ₹2,00,000 after the offer ends.
          </p>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 16, lineHeight: 1.8 }}>
            <li><strong style={{ color: "var(--text)" }}>2 years</strong> of Jackpot Bot access + Sideways Market Signals Indicator free (2 Yrs.)</li>
            <li>Setup &amp; deploy on TradingView</li>
            <li><strong style={{ color: "var(--text)" }}>Unlimited</strong> support (first priority, 9:30 am – 9 pm)</li>
            <li>Raise support tickets directly from your dashboard</li>
            <li>Premium VIP Group — <strong style={{ color: "var(--text)" }}>Lifetime</strong> access</li>
            <li>Free training / demo class</li>
            <li>Algo Trading Software — 3 Months Free (T&amp;C)</li>
            <li>Direct trade execution to your broker — automatic Entry &amp; Stop-Loss</li>
          </ul>
          <Link href="/signup?plan=onetime" className="btn" style={{ display: "block", textAlign: "center" }}>
            Choose JB Elite Pro
          </Link>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 14, textAlign: "center" }}>
        Note: Source code will not be provided. Plans include usage access to the Jackpot Bot indicator and software only.
      </p>

      <FeedbackGrid items={items} />

      <p className="muted" style={{ marginTop: 40, fontSize: 13 }}>
        Questions? Message us on Telegram <a href="https://t.me/jackpotbot26" target="_blank">@jackpotbot26</a>
      </p>

      {socialLinks.length > 0 && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>
            Follow us
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                style={{
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "1px solid var(--border, #22303C)",
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="muted" style={{ marginTop: 30, fontSize: 12, textAlign: "center" }}>
        <a href="/terms" style={{ color: "inherit" }}>Terms &amp; Conditions</a>
        {" · "}
        <a href="/privacy" style={{ color: "inherit" }}>Privacy Policy</a>
      </p>
    </div>
  );
}
