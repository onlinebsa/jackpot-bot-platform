import Link from "next/link";

export default function Home() {
  return (
    <div className="wrap-wide">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 22 }}>Jackpot Bot</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login" className="btn-secondary">Login</Link>
          <Link href="/signup" className="btn">Sign up</Link>
        </div>
      </div>

      <h2 style={{ fontSize: 28, marginBottom: 6 }}>Get access to Jackpot Bot</h2>
      <p className="muted" style={{ marginBottom: 30 }}>
        TradingView indicator + setup, premium Telegram group and free training.
      </p>

      <div className="grid-2">
        <div className="card">
          <div className="muted" style={{ textTransform: "uppercase", fontSize: 12 }}>Limited-time offer</div>
          <h3 style={{ fontSize: 20, margin: "8px 0" }}>Starter Monthly Plan</h3>
          <div style={{ marginBottom: 4 }}>
            <span style={{ textDecoration: "line-through", color: "var(--muted)", marginRight: 8 }}>₹15,000</span>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>₹5,000</span>
            <span className="muted"> /month</span>
          </div>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 20, lineHeight: 1.8 }}>
            <li>1-month Jackpot Bot access</li>
            <li>Setup &amp; deploy on TradingView</li>
            <li>Support for any issue</li>
            <li>Premium Telegram group</li>
            <li>Free training / demo class</li>
          </ul>
          <Link href="/signup?plan=monthly" className="btn" style={{ display: "block", textAlign: "center" }}>
            Choose Starter Monthly Plan
          </Link>
        </div>

        <div className="card" style={{ borderColor: "var(--amber)" }}>
          <div style={{ color: "var(--amber)", textTransform: "uppercase", fontSize: 12 }}>Best value</div>
          <h3 style={{ fontSize: 20, margin: "8px 0" }}>2 Year Pro Plan</h3>
          <div style={{ marginBottom: 4 }}>
            <span style={{ textDecoration: "line-through", color: "var(--muted)", marginRight: 8 }}>₹1,50,000</span>
            <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>₹60,000</span>
          </div>
          <ul className="muted" style={{ paddingLeft: 18, marginBottom: 20, lineHeight: 1.8 }}>
            <li><strong style={{ color: "var(--text)" }}>2 years</strong> of Jackpot Bot access</li>
            <li>Setup &amp; deploy on TradingView</li>
            <li><strong style={{ color: "var(--text)" }}>Unlimited</strong> support</li>
            <li>Premium Telegram group</li>
            <li>Free training / demo class</li>
          </ul>
          <Link href="/signup?plan=onetime" className="btn" style={{ display: "block", textAlign: "center" }}>
            Choose 2 Year Pro Plan
          </Link>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 40, fontSize: 13 }}>
        Questions? Message us on Telegram <a href="https://t.me/jackpotbot26" target="_blank">@jackpotbot26</a>
      </p>
    </div>
  );
}