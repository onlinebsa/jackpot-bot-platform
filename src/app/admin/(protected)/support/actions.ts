"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function replyToTicket(ticketId: string, message: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("ticket_replies").insert({ ticket_id: ticketId, sender: "admin", message });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function resolveTicket(ticketId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", ticketId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}
