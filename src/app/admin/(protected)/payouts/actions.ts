"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { sendCommissionPaidEmail } from "@/lib/email";

export async function markCommissionPaid(commissionId: string, utr: string) {
  await requireAdminSession();
  if (!utr || utr.trim().length < 3) throw new Error("Enter the UTR / transaction reference for this payout.");
  const supabase = createAdminClient();

  const { data: commission, error } = await supabase
    .from("commissions")
    .update({ status: "paid", payout_utr: utr.trim(), paid_at: new Date().toISOString() })
    .eq("id", commissionId)
    .in("status", ["pending", "requested"])
    .select("amount, referrer_id")
    .single();
  if (error) throw new Error(error.message);

  if (commission?.referrer_id) {
    const { data: referrer } = await supabase
      .from("profiles").select("email, full_name").eq("id", commission.referrer_id).single();
    if (referrer?.email) {
      await sendCommissionPaidEmail({
        to: referrer.email,
        referrerName: referrer.full_name ?? "there",
        amount: Number(commission.amount),
        utr: utr.trim(),
      });
    }
  }

  revalidatePath("/admin/payouts");
}