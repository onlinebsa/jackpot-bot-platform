"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";

export async function addExpense(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const category = String(formData.get("category") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const payment_mode = String(formData.get("payment_mode") || "").trim();
  const entry_date = String(formData.get("entry_date") || "").trim();
  const paid_to = String(formData.get("paid_to") || "").trim();
  const authorised_by = String(formData.get("authorised_by") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!category || !amount || !payment_mode || !entry_date) {
    throw new Error("Category, amount, payment mode, and entry date are required.");
  }

  const { error } = await supabase.from("expenses").insert({
    category,
    amount,
    payment_mode,
    entry_date,
    paid_to,
    authorised_by,
    notes,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/expenses");
}

export async function deleteExpense(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/expenses");
}