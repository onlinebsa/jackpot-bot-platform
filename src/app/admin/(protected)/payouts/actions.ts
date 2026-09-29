"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function markCommissionPaid(commissionId: string, utr: string) {
  await requireAdminSession();
  if (!utr || utr.trim().length < 3) throw new Error("Enter the UTR / transaction reference for this payout.");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("commissions")
    .update({ status: "paid", payout_utr: utr.trim(), paid_at: new Date().toISOString() })
    .eq("id", commissionId)
    .in("status", ["pending", "requested"]);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payouts");
}
