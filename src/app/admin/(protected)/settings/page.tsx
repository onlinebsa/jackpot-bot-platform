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

        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--border, #22303C)" }} />

        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>
          Customer quick-action links
        </div>

        <div className="field">
          <label>Support — Telegram link</label>
          <input name="link_support" defaultValue={settings?.link_support ?? ""} placeholder="https://t.me/yourchannel" />
        </div>

        <div className="field">
          <label>Demo Training — Google Meet link</label>
          <input name="link_demo_training" defaultValue={settings?.link_demo_training ?? ""} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
        </div>

        <div className="field">
          <label>TV Setup & Setting — Google Meet link</label>
          <input name="link_tv_setup" defaultValue={settings?.link_tv_setup ?? ""} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
        </div>

        <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid var(--border, #22303C)" }} />

        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>
          Social media links (shown on homepage)
        </div>

        <div className="field">
          <label>YouTube</label>
          <input name="link_youtube" defaultValue={settings?.link_youtube ?? ""} placeholder="https://youtube.com/@yourchannel" />
        </div>

        <div className="field">
          <label>Instagram</label>
          <input name="link_instagram" defaultValue={settings?.link_instagram ?? ""} placeholder="https://instagram.com/yourhandle" />
        </div>

        <div className="field">
          <label>Facebook</label>
          <input name="link_facebook" defaultValue={settings?.link_facebook ?? ""} placeholder="https://facebook.com/yourpage" />
        </div>

        <button className="btn">Save settings</button>
      </form>
    </div>
  );
}
