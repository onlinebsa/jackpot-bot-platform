"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { COMMISSION_BY_PLAN, payableOnDate } from "@/lib/referral";

export async function approvePayment(paymentId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { data: payment, error: fetchError } = await supabase
    .from("payments").select("*").eq("id", paymentId).single();
  if (fetchError || !payment) throw new Error("Payment not found");

  const now = new Date();
  let expiry: string | null = null;
  const d = new Date();
  if (payment.plan === "monthly") {
    d.setMonth(d.getMonth() + 1);
    expiry = d.toISOString();
  } else if (payment.plan === "onetime") {
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
    .update({ status: "approved", approved_at: now.toISOString() })
    .eq("id", paymentId);
  if (paymentError) throw new Error(paymentError.message);

  const { error: invoiceError } = await supabase.rpc("assign_invoice_number", { p_payment_id: paymentId });
  if (invoiceError) console.error("Invoice number generation failed:", invoiceError.message);

  const commissionAmount = COMMISSION_BY_PLAN[payment.plan];
  const { data: buyer } = await supabase
    .from("profiles").select("referred_by").eq("id", payment.user_id).single();
  if (buyer?.referred_by && commissionAmount) {
    await supabase.from("commissions").upsert(
      {
        referrer_id: buyer.referred_by,
        referred_user_id: payment.user_id,
        payment_id: paymentId,
        amount: commissionAmount,
        plan: payment.plan,
        payable_on: payableOnDate(now),
        status: "pending",
      },
      { onConflict: "referred_user_id", ignoreDuplicates: true }
    );
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/payouts");
}

export async function rejectPayment(paymentId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("payments").update({ status: "rejected" }).eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}

export async function getScreenshotUrl(path: string): Promise<string | null> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("payment-screenshots").createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}

export async function markTvAccessGranted(paymentId: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payments")
    .update({ tv_access_granted: true, tv_access_granted_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/payments");
}