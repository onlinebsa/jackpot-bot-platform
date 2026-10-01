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
    .select("plan, amount, invoice_number, approved_at, profiles!payments_user_id_fkey(full_name, username)")
    .eq("status", "approved")
    .order("approved_at", { ascending: false });

  if (from) query = query.gte("approved_at", from);
  if (to) query = query.lte("approved_at", to + "T23:59:59");

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []).map((p: any) => ({
    ...p,
    customer_name: p.profiles?.full_name,
    customer_username: p.profiles?.username,
  }));

  const csv = toCsv(rows, [
    { key: "approved_at", label: "Date" },
    { key: "customer_name", label: "Customer Name" },
    { key: "customer_username", label: "Username" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Amount" },
    { key: "invoice_number", label: "Invoice No" },
  ]);

  const filename = `sales_${from || "all"}_to_${to || "all"}.csv`;
  return csvResponse(filename, csv);
}