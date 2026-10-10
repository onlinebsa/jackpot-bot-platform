import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { toCsv, csvResponse } from "@/lib/csv";

const PLAN_LABEL: Record<string, string> = { monthly: "JB Starter", onetime: "JB Elite Pro" };

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = createAdminClient();
  let query = supabase
    .from("commissions")
    .select("*, profiles!commissions_referrer_id_fkey(full_name, whatsapp_number, upi_id)")
    .order("payable_on", { ascending: false });

  if (from) query = query.gte("payable_on", from);
  if (to) query = query.lte("payable_on", to);

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []).map((r: any) => ({
    referrer_name: r.profiles?.full_name,
    referrer_whatsapp: r.profiles?.whatsapp_number,
    referrer_upi: r.profiles?.upi_id,
    plan: PLAN_LABEL[r.plan] ?? r.plan,
    amount: r.amount,
    status: r.status,
    payable_on: r.payable_on,
    paid_at: r.paid_at,
    payout_utr: r.payout_utr,
  }));

  const csv = toCsv(rows, [
    { key: "referrer_name", label: "Referrer Name" },
    { key: "referrer_whatsapp", label: "WhatsApp" },
    { key: "referrer_upi", label: "UPI ID" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Commission Amount" },
    { key: "status", label: "Status" },
    { key: "payable_on", label: "Unlocked On" },
    { key: "paid_at", label: "Paid At" },
    { key: "payout_utr", label: "Payout UTR" },
  ]);

  const filename = `commission_report_${from || "all"}_to_${to || "all"}.csv`;
  return csvResponse(filename, csv);
}