"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, adminId: user.id };
}

export async function approvePayment(paymentId: string) {
  const { supabase, adminId } = await requireAdmin();

  const { data: payment, error: fetchError } = await supabase
    .from("payments").select("*").eq("id", paymentId).single();
  if (fetchError || !payment) throw new Error("Payment not found");

  let expiry: string | null = null;
  const d = new Date();
  if (payment.plan === "monthly") {
    d.setMonth(d.getMonth() + 1);
    expiry = d.toISOString();
  } else if (payment.plan === "onetime") {
    // "onetime" plan = the 2-Year Plan (₹60,000) — expires 2 years from approval
    d.setFullYear(d.getFullYear() + 2);
    expiry = d.toISOString();
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ plan: payment.plan, status: "active", plan_expiry: expiry })
    .eq("id", payment.user_id);
  if (profileError) throw new Error(profileError.message);

  const { error: paymentError } = await supabase
    .from("payments")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: adminId })
    .eq("id", paymentId);
  if (paymentError) throw new Error(paymentError.message);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/customers");
}

export async function rejectPayment(paymentId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("payments").update({ status: "rejected" }).eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}

export async function getScreenshotUrl(path: string): Promise<string | null> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.storage.from("payment-screenshots").createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}
