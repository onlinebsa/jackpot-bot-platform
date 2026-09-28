"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function getAdminNotifications() {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("audience", "admin")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markAdminNotificationRead(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllAdminNotificationsRead() {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("audience", "admin")
    .eq("is_read", false);
  if (error) throw new Error(error.message);
}