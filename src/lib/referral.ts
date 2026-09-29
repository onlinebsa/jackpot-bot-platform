// Referral reward per plan the referred friend buys (their first approved payment only)
export const COMMISSION_BY_PLAN: Record<string, number> = {
  monthly: 500,
  onetime: 3000, // the 2-Year Plan
};

export const PAYOUT_DAY = 5; // rewards unlock on the 5th of the month after approval

// The date a reward becomes withdrawable: the 5th of the month AFTER `approvedOn`.
export function payableOnDate(approvedOn: Date): string {
  const d = new Date(approvedOn.getFullYear(), approvedOn.getMonth() + 1, PAYOUT_DAY);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (date-only column)
}
