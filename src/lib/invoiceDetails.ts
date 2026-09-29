// Shown on every customer invoice. Edit these if your business details change.
export const INVOICE_DETAILS = {
  companyName: "Zenova Traders",
  gstin: "10AKJPA1097N1ZL",
  productName: "Trading Indicator Software Services",
  taxRatePercent: 18, // GST is already included in the displayed plan price
  invoicePrefix: "ZT",
};

/** Given a tax-inclusive amount, split it into base price + GST. */
export function splitInclusiveTax(amount: number, taxRatePercent: number) {
  const base = amount / (1 + taxRatePercent / 100);
  const tax = amount - base;
  return { base: Math.round(base * 100) / 100, tax: Math.round(tax * 100) / 100 };
}
