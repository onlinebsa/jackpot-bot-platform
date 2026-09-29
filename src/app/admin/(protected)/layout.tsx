import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminLoggedIn } from "@/lib/adminAuth";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { NotificationBell } from "./NotificationBell";

const NAV = [
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/payments", label: "Payment Approvals" },
  { href: "/admin/payouts", label: "Referral Payouts" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
  { href: "/admin/sales", label: "Sales Dashboard" },
  { href: "/admin/support", label: "Support Tickets" },
  { href: "/admin/broadcast", label: "Broadcast / Ads" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = await isAdminLoggedIn();
  if (!loggedIn) redirect("/admin/login");

  return (
    <div className="admin-shell">
      <div className="admin-side">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700 }}>
              Jackpot Bot Admin
            </div>
            <NotificationBell />
          </div>
          <nav className="admin-nav">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <AdminLogoutButton />
        </div>
      </div>
      <div className="admin-main">{children}</div>
    </div>
  );
}