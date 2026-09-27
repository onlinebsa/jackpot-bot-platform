"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const whatsapp_number = String(formData.get("whatsapp_number") || "").trim();
  const reminder_days = formData
    .getAll("reminder_days")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  const { error } = await supabase
    .from("admin_settings")
    .update({ whatsapp_number, reminder_days: reminder_days.length ? reminder_days : [1, 3, 5, 7] })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
}
