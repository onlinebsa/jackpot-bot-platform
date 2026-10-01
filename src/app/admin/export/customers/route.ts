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
    .from("profiles")
    .select("full_name, username, email, whatsapp_number, plan, status, address_village_town, address_district, address_state, address_pincode, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + "T23:59:59");

  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const csv = toCsv(data ?? [], [
    { key: "full_name", label: "Full Name" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "whatsapp_number", label: "WhatsApp" },
    { key: "plan", label: "Plan" },
    { key: "status", label: "Status" },
    { key: "address_village_town", label: "Village/Town" },
    { key: "address_district", label: "District" },
    { key: "address_state", label: "State" },
    { key: "address_pincode", label: "Pincode" },
    { key: "created_at", label: "Joined" },
  ]);

  const filename = `customers_${from || "all"}_to_${to || "all"}.csv`;
  return csvResponse(filename, csv);
}