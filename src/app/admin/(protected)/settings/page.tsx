import { createAdminClient } from "@/lib/supabase/admin";
import { updateSettings } from "./actions";

const DAY_OPTIONS = [1, 3, 5, 7];

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("admin_settings").select("*").eq("id", 1).single();
  const activeDays: number[] = settings?.reminder_days ?? [1, 3, 5, 7];

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>Settings</h1>

      <form action={updateSettings} className="card" style={{ maxWidth: 480 }}>
        <div className="field">
          <label>Admin WhatsApp number (used for all WhatsApp actions — with country code, no +)</label>
          <input name="whatsapp_number" defaultValue={settings?.whatsapp_number ?? ""} placeholder="919999999999" />
        </div>

        <div className="field">
          <label>Expiry reminder schedule (days before expiry)</label>
          <div style={{ display: "flex", gap: 14 }}>
            {DAY_OPTIONS.map((d) => (
              <label key={d} style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13.5 }}>
                <input
                  type="checkbox"
                  name="reminder_days"
                  value={d}
                  defaultChecked={activeDays.includes(d)}
                  style={{ width: "auto" }}
                />
                {d} day{d > 1 ? "s" : ""}
              </label>
            ))}
          </div>
        </div>

        <button className="btn">Save settings</button>
      </form>
    </div>
  );
}
