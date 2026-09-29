import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { INVOICE_DETAILS, splitInclusiveTax } from "@/lib/invoiceDetails";
import { PrintButton } from "./PrintButton";

const PLAN_LABEL: Record<string, string> = { 
  monthly: "Monthly Plan (1 month)", 
  onetime: "2-Year Plan" 
};

export default async function InvoicePage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payment } = await supabase
    .from("payments").select("*").eq("id", paymentId).eq("user_id", user.id).single();
  const { data: profile } = await supabase
    .from("profiles").select("full_name, email, whatsapp_number, address").eq("id", user.id).single();

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
  const cgst = tax / 2;
  const sgst = tax / 2;

  return (
    <div className="wrap-wide">
      <PrintButton />
      <div className="card" id="invoice" style={{ padding: "30px", background: "#fff" }}>
        
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, margin: "0 0 4px 0", fontWeight: "bold" }}>{INVOICE_DETAILS.companyName}</h1>
            <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}>Shahbazpur Salem, PO. Bhikhanpur, Muzaffarpur, Bihar 842002</p>
            <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}><strong>GSTIN:</strong> 1OAKJPA1097N2Z9</p>
            <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}><strong>Email:</strong> support@zenovatrader.in</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: 20, margin: "0 0 4px 0", color: "#111" }}>TAX INVOICE</h2>
            <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}><strong>Invoice #:</strong> {payment.invoice_number}</p>
            <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}>
              <strong>Date:</strong> {new Date(payment.invoice_date ?? payment.approved_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}><strong>Place of Supply:</strong> Bihar (10)</p>
          </div>
        </div>

        {/* Billed To Section */}
        <div style={{ marginBottom: 24 }}>
          <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", fontWeight: "bold", marginBottom: 6 }}>Billed To</div>
          <p style={{ margin: "0 0 2px 0", fontWeight: "600" }}>{profile?.full_name || "Valued Customer"}</p>
          <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}>Email: {profile?.email}</p>
          <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}>Phone: {profile?.whatsapp_number || "N/A"}</p>
          {profile?.address && <p className="muted" style={{ margin: "2px 0", fontSize: 13 }}>Address: {profile.address}</p>}
        </div>

        {/* Invoice Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left", background: "#f8f9fa" }}>
              <th style={{ padding: "10px" }}>Description</th>
              <th style={{ padding: "10px" }}>SAC Code</th>
              <th style={{ padding: "10px", textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "12px 10px" }}>
                <strong>{INVOICE_DETAILS.productName}</strong> — {PLAN_LABEL[payment.plan] ?? payment.plan}
                {payment.promo_code && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Promo code applied: {payment.promo_code}</div>
                )}
              </td>
              <td style={{ padding: "12px 10px" }}>998315</td>
              <td style={{ padding: "12px 10px", textAlign: "right" }}>₹{base.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        {/* Tax Calculations Breakdown */}
        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <div style={{ width: "280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: 13 }}>
              <span className="muted">Taxable Value:</span>
              <span>₹{base.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: 13 }}>
              <span className="muted">CGST (9%):</span>
              <span>₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: 13 }}>
              <span className="muted">SGST (9%):</span>
              <span>₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0 0 0", fontSize: 15, fontWeight: "bold", borderTop: "2px solid #111", paddingTop: 8 }}>
              <span>Total Paid:</span>
              <span>₹{Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Metadata */}
        <div className="muted" style={{ fontSize: 13, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <p style={{ margin: "4px 0" }}><strong>Payment Method:</strong> {payment.method === "razorpay_link" ? "Razorpay" : "UPI (manual)"}</p>
          {payment.utr && <p style={{ margin: "4px 0" }}><strong>Transaction Ref (UTR):</strong> {payment.utr}</p>}
          <p style={{ margin: "4px 0" }}><strong>Payment Status:</strong> Paid</p>
        </div>

        {/* Legal Disclaimers & Footer */}
        <div className="muted" style={{ fontSize: 11, marginTop: 24, borderTop: "1px dashed #ccc", paddingTop: 12, color: "#666" }}>
          <p style={{ margin: "2px 0" }}><strong>Terms & Legal Disclaimer:</strong></p>
          <p style={{ margin: "2px 0" }}>1. <strong>Educational Purpose:</strong> {INVOICE_DETAILS.productName} is a software/technical indicator tool provided strictly for educational and analytical purposes. Zenova Traders is not a SEBI-registered advisor.</p>
          <p style={{ margin: "2px 0" }}>2. <strong>Refund Policy:</strong> Digital software access and subscriptions are strictly non-refundable and non-transferable once activated.</p>
          <p style={{ margin: "6px 0 0 0", fontStyle: "italic" }}>This is a computer-generated invoice and does not require a physical signature.</p>
        </div>

      </div>
    </div>
  );
}
