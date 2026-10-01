import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { toCsv, csvResponse } from "@/lib/csv";

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
    .from("payments")
    .select("plan, amount, promo_code, utr, status, tradingview_username, invoice_number, created_at, approved_at, profiles!payments_user_id_fkey(full_name, username)")
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + "T23:59:59");

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []).map((p: any) => ({
    ...p,
    customer_name: p.profiles?.full_name,
    customer_username: p.profiles?.username,
  }));

  const csv = toCsv(rows, [
    { key: "customer_name", label: "Customer Name" },
    { key: "customer_username", label: "Username" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Amount" },
    { key: "promo_code", label: "Promo Code" },
    { key: "utr", label: "UTR" },
    { key: "status", label: "Status" },
    { key: "tradingview_username", label: "TradingView Username" },
    { key: "invoice_number", label: "Invoice No" },
    { key: "created_at", label: "Created" },
    { key: "approved_at", label: "Approved" },
  ]);

  const filename = `payments_${from || "all"}_to_${to || "all"}.csv`;
  return csvResponse(filename, csv);
}