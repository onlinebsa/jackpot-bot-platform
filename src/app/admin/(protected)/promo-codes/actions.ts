"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function createPromoCode(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const code = String(formData.get("code")).trim().toUpperCase();
  const discount = Number(formData.get("discount"));

  const { error } = await supabase.from("promo_codes").insert({ code, discount_percent: discount });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/promo-codes");
}
