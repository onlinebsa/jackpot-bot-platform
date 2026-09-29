"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function createPromoCode(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const code = String(formData.get("code")).trim().toUpperCase();
  const discount = Number(formData.get("discount"));
  const expires = String(formData.get("expires") || "").trim(); // optional YYYY-MM-DD

  // valid through the end of the chosen day (IST)
  const expires_at = expires ? new Date(`${expires}T23:59:59+05:30`).toISOString() : null;

  const { error } = await supabase
    .from("promo_codes")
    .insert({ code, discount_percent: discount, expires_at });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/promo-codes");
}
