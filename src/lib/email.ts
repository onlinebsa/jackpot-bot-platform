import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Jackpot Bot <noreply@jackpotbot.live>";

export async function sendPaymentConfirmationEmail(opts: {
  to: string;
  customerName: string;
  plan: string;
  amount: number;
  invoiceNumber?: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: "Payment Approved — Jackpot Bot Access Activated",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #F5A623;">Payment Approved ✅</h2>
          <p>Hi ${opts.customerName},</p>
          <p>Your payment for the <strong>${opts.plan}</strong> plan (₹${opts.amount.toLocaleString("en-IN")}) has been approved.</p>
          <p>Your Jackpot Bot access is now active. Log in to your dashboard to get started.</p>
          ${opts.invoiceNumber ? `<p style="color: #666; font-size: 13px;">Invoice No: ${opts.invoiceNumber}</p>` : ""}
          <p style="margin-top: 24px;">Questions? Message us on Telegram: <a href="https://t.me/jackpotbot26">@jackpotbot26</a></p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send payment confirmation email:", err);
  }
}

export async function sendExpiryReminderEmail(opts: {
  to: string;
  customerName: string;
  plan: string;
  expiryDate: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: `Your Jackpot Bot plan expires on ${opts.expiryDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #F5A623;">Plan Expiring Soon ⏰</h2>
          <p>Hi ${opts.customerName},</p>
          <p>Your <strong>${opts.plan}</strong> plan expires on <strong>${opts.expiryDate}</strong>.</p>
          <p>Renew now to keep uninterrupted access to Jackpot Bot.</p>
          <p style="margin-top: 24px;">Questions? Message us on Telegram: <a href="https://t.me/jackpotbot26">@jackpotbot26</a></p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send expiry reminder email:", err);
  }
}

export async function sendCommissionEarnedEmail(opts: {
  to: string;
  referrerName: string;
  amount: number;
  referredName: string;
  plan: string;
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: `You earned ₹${opts.amount.toLocaleString("en-IN")} commission!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #F5A623;">Commission Earned 🎉</h2>
          <p>Hi ${opts.referrerName},</p>
          <p><strong>${opts.referredName}</strong> just bought the <strong>${opts.plan}</strong> plan using your referral code.</p>
          <p>You've earned <strong>₹${opts.amount.toLocaleString("en-IN")}</strong> commission. It will unlock for withdrawal on the 5th of next month — check your dashboard for details.</p>
          <p style="margin-top: 24px;">Questions? Message us on Telegram: <a href="https://t.me/jackpotbot26">@jackpotbot26</a></p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send commission earned email:", err);
  }
}