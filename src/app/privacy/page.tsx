export default function PrivacyPolicyPage() {
  return (
    <div className="wrap">
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>Privacy Policy</h1>
      <p className="muted" style={{ fontSize: 13, marginBottom: 30 }}>Last updated: October 2026</p>

      <div className="card" style={{ lineHeight: 1.7, fontSize: 14.5 }}>
        <h3 style={{ fontSize: 16, marginTop: 0 }}>1. Who we are</h3>
        <p>
          This Privacy Policy explains how <strong>Zenova Traders</strong> ("we", "us", "our") collects,
          uses, and protects your personal information when you use the Jackpot Bot website and services.
        </p>

        <h3 style={{ fontSize: 16 }}>2. Information we collect</h3>
        <p>When you create an account or use our service, we collect:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Full name, username, email address, WhatsApp and calling number</li>
          <li>Address (village/town, district, state, pincode) — used for GST invoicing</li>
          <li>TradingView username — used to grant indicator access</li>
          <li>Payment details: plan selected, amount, UTR/transaction reference, and payment screenshots
            (for manual UPI payments)</li>
          <li>Trading experience, markets traded, and profession — collected at signup for our records</li>
          <li>Referral code (if you signed up through a friend's link) and your own UPI ID (if you
            participate in our referral program)</li>
          <li>Feedback, ratings, and any screenshots you choose to submit</li>
          <li>Support ticket messages you send us</li>
        </ul>

        <h3 style={{ fontSize: 16 }}>3. How we use your information</h3>
        <p>We use the information we collect to:</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Create and manage your account</li>
          <li>Verify your payments and activate your TradingView access</li>
          <li>Generate GST-compliant tax invoices</li>
          <li>Process referral commissions and payouts</li>
          <li>Respond to support requests</li>
          <li>Send you service-related emails (payment confirmation, renewal reminders, commission
            notifications) and, where applicable, WhatsApp messages</li>
          <li>Improve our website and services</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h3 style={{ fontSize: 16 }}>4. Payment information</h3>
        <p>
          We do not store your card or bank login details. Payments made via Razorpay are processed directly
          by Razorpay under its own security standards. For manual UPI payments, we only store the UTR
          (transaction reference number) and a screenshot you provide as proof of payment, used solely for
          verification.
        </p>

        <h3 style={{ fontSize: 16 }}>5. Public feedback</h3>
        <p>
          If you submit feedback through our dashboard, your name, rating, feedback text, and any screenshot
          you attach may be displayed publicly on our homepage to showcase customer experiences. Do not
          submit information you do not want shown publicly.
        </p>

        <h3 style={{ fontSize: 16 }}>6. Data storage and security</h3>
        <p>
          Your data is stored securely using Supabase (database and file storage) and hosted on Vercel. We
          use industry-standard measures such as encrypted connections (HTTPS) and access controls to protect
          your information. However, no method of transmission or storage is 100% secure.
        </p>

        <h3 style={{ fontSize: 16 }}>7. Data retention</h3>
        <p>
          We retain your account and transaction data for as long as your account is active and as required
          to meet our legal, tax, and accounting obligations (including GST record-keeping requirements
          under Indian law).
        </p>

        <h3 style={{ fontSize: 16 }}>8. Your rights</h3>
        <p>
          You can view your account details from your dashboard at any time. To request correction or
          deletion of your personal data, or to ask any question about how your data is used, email us at{" "}
          <a href="mailto:info.zenova11@gmail.com">info.zenova11@gmail.com</a>.
        </p>

        <h3 style={{ fontSize: 16 }}>9. Third-party services</h3>
        <p>
          We use trusted third-party providers to operate our service, including Supabase (database/storage),
          Vercel (hosting), Razorpay (payments), and Resend (transactional emails). These providers process
          data only as needed to provide their services to us.
        </p>

        <h3 style={{ fontSize: 16 }}>10. Changes to this policy</h3>
        <p>
          We may update this Privacy Policy from time to time. Continued use of our service after changes are
          posted means you accept the revised policy.
        </p>

        <h3 style={{ fontSize: 16 }}>11. Contact us</h3>
        <p>
          Questions about this Privacy Policy? Email{" "}
          <a href="mailto:info.zenova11@gmail.com">info.zenova11@gmail.com</a> or message us on Telegram{" "}
          <a href="https://t.me/jackpotbot26" target="_blank">@jackpotbot26</a>.
        </p>
      </div>
    </div>
  );
}