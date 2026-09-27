"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logReminderSent(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("reminder_logs").insert({ user_id: userId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}
