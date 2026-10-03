"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { sendExpiryReminderEmail } from "@/lib/email";

const PLAN_LABEL: Record<string, string> = { monthly: "Starter Monthly Plan", onetime: "2 Year Pro Plan" };

export async function logReminderSent(userId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, plan, plan_expiry")
    .eq("id", userId)
    .single();

  if (profile?.email && profile.plan_expiry) {
    await sendExpiryReminderEmail({
      to: profile.email,
      customerName: profile.full_name ?? "there",
      plan: PLAN_LABEL[profile.plan ?? ""] ?? profile.plan ?? "your plan",
      expiryDate: new Date(profile.plan_expiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    });
  }

  const { error } = await supabase.from("reminder_logs").insert({ user_id: userId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}