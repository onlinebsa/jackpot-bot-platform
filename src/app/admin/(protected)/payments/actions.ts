"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { COMMISSION_BY_PLAN, payableOnDate } from "@/lib/referral";
import { sendPaymentConfirmationEmail, sendCommissionEarnedEmail } from "@/lib/email";

const PLAN_LABEL: Record<string, string> = { monthly: "JB Starter", onetime: "JB Elite Pro" };

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ plan: payment.plan, status: "active", plan_expiry: expiry })
    .eq("id", payment.user_id)
    .select("email, full_name, referred_by")
    .single();
  if (profileError) throw new Error(profileError.message);

  const { error: paymentError } = await supabase
    .from("payments")
    .update({ status: "approved", approved_at: now.toISOString() })
    .eq("id", paymentId);
  if (paymentError) throw new Error(paymentError.message);

  const { error: invoiceError } = await supabase.rpc("assign_invoice_number", { p_payment_id: paymentId });
  if (invoiceError) console.error("Invoice number generation failed:", invoiceError.message);

  const { data: updatedPayment } = await supabase
    .from("payments").select("invoice_number").eq("id", paymentId).single();

  if (profile?.email) {
    await sendPaymentConfirmationEmail({
      to: profile.email,
      customerName: profile.full_name ?? "there",
      plan: PLAN_LABEL[payment.plan] ?? payment.plan,
      amount: Number(payment.amount),
      invoiceNumber: updatedPayment?.invoice_number ?? undefined,
    });
  }

  const commissionAmount = COMMISSION_BY_PLAN[payment.plan];
  if (profile?.referred_by && commissionAmount) {
    await supabase.from("commissions").upsert(
      {
        referrer_id: profile.referred_by,
        referred_user_id: payment.user_id,
        payment_id: paymentId,
        amount: commissionAmount,
        plan: payment.plan,
        payable_on: payableOnDate(now),
        status: "pending",
      },
      { onConflict: "referred_user_id", ignoreDuplicates: true }
    );

    const { data: referrer } = await supabase
      .from("profiles").select("email, full_name").eq("id", profile.referred_by).single();
    if (referrer?.email) {
      await sendCommissionEarnedEmail({
        to: referrer.email,
        referrerName: referrer.full_name ?? "there",
        amount: commissionAmount,
        referredName: profile.full_name ?? "A customer",
        plan: PLAN_LABEL[payment.plan] ?? payment.plan,
      });
    }
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