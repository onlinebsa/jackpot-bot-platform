import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { BroadcastList } from "./BroadcastList";

const SEGMENTS = [
  { key: "all", label: "All" },
  { key: "monthly", label: "Active Starter Monthly Plan" },
  { key: "onetime", label: "Active 2 Year Pro Plan" },
  { key: "expired", label: "Expired" },
  { key: "no_plan", label: "No plan" },
];

export default async function BroadcastPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const { segment: segmentParam } = await searchParams;
  const segment = segmentParam || "all";
  const supabase = createAdminClient();

  let query = supabase.from("profiles").select("id, full_name, whatsapp_number").eq("role", "customer");

  if (segment === "monthly") query = query.eq("status", "active").eq("plan", "monthly");
  else if (segment === "onetime") query = query.eq("status", "active").eq("plan", "onetime");
  else if (segment === "expired") query = query.eq("status", "expired");
  else if (segment === "no_plan") query = query.eq("status", "no_plan");

  const { data: customers } = await query;

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Broadcast / Ads</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {SEGMENTS.map((s) => (
          <Link
            key={s.key}
            href={`/admin/broadcast?segment=${s.key}`}
            className={segment === s.key ? "btn btn-sm" : "btn-secondary btn-sm"}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <BroadcastList customers={customers ?? []} />
    </div>
  );
}
