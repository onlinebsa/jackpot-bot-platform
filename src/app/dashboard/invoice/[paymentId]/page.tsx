import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { INVOICE_DETAILS, computeGstBreakdown } from "@/lib/invoiceDetails";
import { PrintButton } from "./PrintButton";

const PLAN_LABEL: Record<string, string> = { monthly: "Starter Monthly Plan", onetime: "2 Year Pro Plan" };

function computeValidity(plan: string, approvedAt: string) {
  const start = new Date(approvedAt);
  const end = new Date(approvedAt);
  if (plan === "monthly") end.setMonth(end.getMonth() + 1);
  else if (plan === "onetime") end.setFullYear(end.getFullYear() + 2);
  return { start, end };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function InvoicePage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payment } = await supabase
    .from("payments").select("*").eq("id", paymentId).eq("user_id", user.id).single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, whatsapp_number, address_village_town, address_district, address_state, address_pincode")
    .eq("id", user.id).single();

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

  const gst = computeGstBreakdown(Number(payment.amount), INVOICE_DETAILS.taxRatePercent, profile?.address_state);
  const { start, end } = computeValidity(payment.plan, payment.approved_at);

  const addressLine = [
    profile?.address_village_town,
    profile?.address_district,
    profile?.address_state && profile?.address_pincode
      ? `${profile.address_state} ${profile.address_pincode}`
      : profile?.address_state || profile?.address_pincode,
  ].filter(Boolean).join(", ");

  return (
    <div className="wrap-wide invoice-page">
      <style>{`
        .invoice-page { background: #ffffff; }
        .invoice-page, .invoice-page * { color: #111111 !important; }
        .invoice-page .muted { color: #555555 !important; }
        .invoice-page #invoice { background: #ffffff !important; border: 1px solid #dddddd !important; }
        .invoice-page table th, .invoice-page table td { border-color: #dddddd !important; }
        @media print {
          .invoice-page { background: #ffffff !important; }
        }
      `}</style>
      <PrintButton />
      <div className="card" id="invoice">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, margin: "6px 0" }}>TAX INVOICE</h2>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>{INVOICE_DETAILS.companyName.toUpperCase()}</h1>
          <p className="muted" style={{ fontSize: 13, margin: "2px 0" }}>Address: {INVOICE_DETAILS.businessAddress}</p>
          <p className="muted" style={{ fontSize: 13, margin: "2px 0" }}>GSTIN: {INVOICE_DETAILS.gstin}</p>
          <p className="muted" style={{ fontSize: 13, margin: "2px 0" }}>Email: {INVOICE_DETAILS.businessEmail}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 13 }}>
          <div>Invoice No: {payment.invoice_number}</div>
          <div>Date: {formatDate(new Date(payment.invoice_date ?? payment.approved_at))}</div>
        </div>
        <p style={{ fontSize: 13, marginBottom: 20 }}>
          Place of Supply: {profile?.address_state || "—"}
        </p>

        <div style={{ marginBottom: 20 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 4 }}>Billed to</div>
          <p style={{ margin: "2px 0" }}>Customer Name: {profile?.full_name}</p>
          <p style={{ margin: "2px 0" }}>Phone Number: {profile?.whatsapp_number}</p>
          <p style={{ margin: "2px 0" }}>Email ID: {profile?.email}</p>
          <p style={{ margin: "2px 0" }}>Address: {addressLine || "—"}</p>
        </div>

        <table style={{ marginBottom: 20 }}>
          <thead><tr><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>
                {INVOICE_DETAILS.productName} — {PLAN_LABEL[payment.plan] ?? payment.plan}
                <div className="muted" style={{ fontSize: 12 }}>SAC Code: {INVOICE_DETAILS.sacCode}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Plan Validity: {payment.plan === "monthly" ? "1 Month" : "2 Years"} ({formatDate(start)} to {formatDate(end)})
                </div>
                {payment.promo_code && <div className="muted" style={{ fontSize: 12 }}>Promo code applied: {payment.promo_code}</div>}
              </td>
              <td>₹{gst.base.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            {gst.type === "intra" ? (
              <>
                <tr>
                  <td className="muted">CGST (9%)</td>
                  <td>₹{gst.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="muted">SGST (9%)</td>
                  <td>₹{gst.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td className="muted">IGST (18%)</td>
                <td>₹{gst.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 700 }}>Total Amount Paid (Tax Inclusive)</td>
              <td style={{ fontWeight: 700 }}>₹{Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
          <p style={{ margin: "4px 0" }}>Payment Status: Paid</p>
          <p style={{ margin: "4px 0" }}>Payment Method: {payment.method === "razorpay_link" ? "Razorpay" : "UPI / Bank Transfer"}</p>
          {payment.utr && <p style={{ margin: "4px 0" }}>Transaction Ref (UTR): {payment.utr}</p>}
        </div>

        <div style={{ borderTop: "1px solid #dddddd", paddingTop: 14 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 8 }}>Terms &amp; Conditions</div>
          <ol style={{ paddingLeft: 18, fontSize: 12, color: "#555555", lineHeight: 1.6 }}>
            {INVOICE_DETAILS.terms.map((t, i) => <li key={i} style={{ marginBottom: 6 }}>{t}</li>)}
          </ol>
        </div>
      </div>
    </div>
  );
}
