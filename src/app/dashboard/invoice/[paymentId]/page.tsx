import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { INVOICE_DETAILS, splitInclusiveTax } from "@/lib/invoiceDetails";
import { PrintButton } from "./PrintButton";

const PLAN_LABEL: Record<string, string> = { monthly: "Monthly Plan (1 month)", onetime: "2-Year Plan" };

export default async function InvoicePage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payment } = await supabase
    .from("payments").select("*").eq("id", paymentId).eq("user_id", user.id).single();
  const { data: profile } = await supabase
    .from("profiles").select("full_name, email, whatsapp_number").eq("id", user.id).single();

  if (!payment) {
    return <div className="wrap"><p>Invoice not found.</p></div>;
  }
  if (payment.status !== "approved" || !payment.invoice_number) {
    return (
      <div className="wrap">
        <p className="muted">
          Invoice is generated once your payment is approved. Please check back after admin approves it, or contact support if it's been a while.
        </p>
        <Link href="/dashboard" className="btn-secondary" style={{ display: "inline-block", marginTop: 12 }}>Back to dashboard</Link>
      </div>
    );
  }

  const { base, tax } = splitInclusiveTax(Number(payment.amount), INVOICE_DETAILS.taxRatePercent);

  return (
    <div className="wrap-wide">
      <PrintButton />
      <div className="card" id="invoice">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <h1 style={{ fontSize: 22, marginBottom: 4 }}>{INVOICE_DETAILS.companyName}</h1>
            <p className="muted" style={{ fontSize: 13 }}>GSTIN: {INVOICE_DETAILS.gstin}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: 18 }}>TAX INVOICE</h2>
            <p className="muted" style={{ fontSize: 13 }}>Invoice #: {payment.invoice_number}</p>
            <p className="muted" style={{ fontSize: 13 }}>
              Date: {new Date(payment.invoice_date ?? payment.approved_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 4 }}>Billed to</div>
          <p style={{ margin: 0 }}>{profile?.full_name}</p>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{profile?.email}</p>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{profile?.whatsapp_number}</p>
        </div>

        <table style={{ marginBottom: 24 }}>
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>
                {INVOICE_DETAILS.productName} — {PLAN_LABEL[payment.plan] ?? payment.plan}
                {payment.promo_code && <div className="muted" style={{ fontSize: 12 }}>Promo code applied: {payment.promo_code}</div>}
              </td>
              <td>₹{base.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="muted">GST ({INVOICE_DETAILS.taxRatePercent}%) — included in price</td>
              <td>₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>Total (tax inclusive)</td>
              <td style={{ fontWeight: 700 }}>₹{Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div className="muted" style={{ fontSize: 13 }}>
          <p style={{ margin: "4px 0" }}>Payment method: {payment.method === "razorpay_link" ? "Razorpay" : "UPI (manual)"}</p>
          {payment.utr && <p style={{ margin: "4px 0" }}>Transaction ref (UTR): {payment.utr}</p>}
          <p style={{ margin: "4px 0" }}>Payment status: Paid</p>
        </div>

        <p className="muted" style={{ fontSize: 12, marginTop: 30 }}>
          This is a system-generated invoice and does not require a signature.
        </p>
      </div>
    </div>
  );
}
