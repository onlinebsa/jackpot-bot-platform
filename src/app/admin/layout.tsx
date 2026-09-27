import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/payments", label: "Payment Approvals" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
  { href: "/admin/sales", label: "Sales Dashboard" },
  { href: "/admin/support", label: "Support Tickets" },
  { href: "/admin/broadcast", label: "Broadcast / Ads" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="admin-shell">
      <div className="admin-side">
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, marginBottom: 20 }}>
            ApexSignal Admin
          </div>
          <nav className="admin-nav">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{profile?.full_name}</div>
          <LogoutButton />
        </div>
      </div>
      <div className="admin-main">{children}</div>
    </div>
  );
}
