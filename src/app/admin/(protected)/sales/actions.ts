"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function logReminderSent(userId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("reminder_logs").insert({ user_id: userId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}
