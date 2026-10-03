"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function updateSettings(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const whatsapp_number = String(formData.get("whatsapp_number") || "").trim();
  const reminder_days = formData
    .getAll("reminder_days")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  const link_support = String(formData.get("link_support") || "").trim();
  const link_demo_training = String(formData.get("link_demo_training") || "").trim();
  const link_tv_setup = String(formData.get("link_tv_setup") || "").trim();

  const link_youtube = String(formData.get("link_youtube") || "").trim();
  const link_instagram = String(formData.get("link_instagram") || "").trim();
  const link_facebook = String(formData.get("link_facebook") || "").trim();

  const { error } = await supabase
    .from("admin_settings")
    .update({
      whatsapp_number,
      reminder_days: reminder_days.length ? reminder_days : [1, 3, 5, 7],
      link_support,
      link_demo_training,
      link_tv_setup,
      link_youtube,
      link_instagram,
      link_facebook,
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  revalidatePath("/");
}