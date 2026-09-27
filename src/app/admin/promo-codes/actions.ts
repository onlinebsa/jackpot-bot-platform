"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPromoCode(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const code = String(formData.get("code")).trim().toUpperCase();
  const discount = Number(formData.get("discount"));

  const { error } = await supabase.from("promo_codes").insert({ code, discount_percent: discount });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/promo-codes");
}
