// Shown on every customer invoice. Edit these if your business details change.
export const INVOICE_DETAILS = {
  companyName: "Zenova Traders",
  gstin: "10AKJPA1097N1ZL",
  businessAddress: "Shahbazpur Salem, PO. Bhikhanpur, Muzaffarpur, Bihar 842002",
  businessEmail: "info.zenova11@gmail.com",
  businessStateName: "Bihar",
  businessStateCode: "10",
  productName: "Jackpot Bot Pro - Trading Indicator",
  sacCode: "998315",
  taxRatePercent: 18, // GST is already included in the displayed plan price
  invoicePrefix: "ZT",
  terms: [
    "Nature of Service: Jackpot Bot Pro is a software/technical indicator tool provided strictly for educational and technical analysis purposes. Zenova Traders is not a SEBI-registered advisor.",
    "Refund Policy: Digital software subscriptions are non-refundable and non-transferable once activated.",
    "This is a system-generated document and does not require a signature.",
  ],
};

/** Given a tax-inclusive amount, split it into base price + GST. */
export function splitInclusiveTax(amount: number, taxRatePercent: number) {
  const base = amount / (1 + taxRatePercent / 100);
  const tax = amount - base;
  return { base: Math.round(base * 100) / 100, tax: Math.round(tax * 100) / 100 };
}

/**
 * Works out whether this is an intra-state sale (CGST+SGST) or inter-state
 * sale (IGST), based on the customer's state vs. the business's home state.
 */
export function computeGstBreakdown(amount: number, taxRatePercent: number, customerState: string | null | undefined) {
  const { base, tax } = splitInclusiveTax(amount, taxRatePercent);
  const isIntraState = (customerState || "").trim().toLowerCase() === INVOICE_DETAILS.businessStateName.toLowerCase();
  if (isIntraState) {
    const half = Math.round((tax / 2) * 100) / 100;
    return { type: "intra" as const, base, cgst: half, sgst: Math.round((tax - half) * 100) / 100 };
  }
  return { type: "inter" as const, base, igst: tax };}
