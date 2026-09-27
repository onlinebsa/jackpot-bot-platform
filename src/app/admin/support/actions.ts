"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function replyToTicket(ticketId: string, message: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ticket_replies").insert({ ticket_id: ticketId, sender: "admin", message });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function resolveTicket(ticketId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").update({ status: "resolved" }).eq("id", ticketId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}
