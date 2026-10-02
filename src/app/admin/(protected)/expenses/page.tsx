import { createAdminClient } from "@/lib/supabase/admin";
import { addExpense, deleteExpense } from "./actions";

const CATEGORIES = [
  "Referral commission",
  "Hosting",
  "Domain",
  "TradingView Plan",
  "Email marketing and notification plan",
  "WhatsApp API",
  "Bulk SMS",
  "Virtual number/IVR for calling",
  "Social media marketing ad",
  "Video explainer ad",
  "Broking API",
  "Staff salary",
  "Office rent",
  "Internet recharge",
  "Bill pay",
  "Tax and file charges",
  "Gadget purchase for business",
  "Others",
];

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
function yearRange(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear() + 1, 0, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function ExpensesPage() {
  const supabase = createAdminClient();
  const now = new Date();
  const m = monthRange(now);
  const y = yearRange(now);

  const [
    { data: monthPayments },
    { data: yearPayments },
    { data: monthExpenses },
    { data: yearExpenses },
    { data: allExpenses },
  ] = await Promise.all([
    supabase.from("payments").select("amount").eq("status", "approved").gte("approved_at", m.start).lt("approved_at", m.end),
    supabase.from("payments").select("amount").eq("status", "approved").gte("approved_at", y.start).lt("approved_at", y.end),
    supabase.from("expenses").select("amount").gte("entry_date", m.start.slice(0, 10)).lt("entry_date", m.end.slice(0, 10)),
    supabase.from("expenses").select("amount").gte("entry_date", y.start.slice(0, 10)).lt("entry_date", y.end.slice(0, 10)),
    supabase.from("expenses").select("*").order("entry_date", { ascending: false }).limit(50),
  ]);

  const sum = (rows: { amount: number }[] | null) => (rows || []).reduce((s, r) => s + Number(r.amount), 0);

  const monthIncome = sum(monthPayments);
  const yearIncome = sum(yearPayments);
  const monthExp = sum(monthExpenses);
  const yearExp = sum(yearExpenses);

  return (
    <div className="wrap-wide">
      <h2>Expense Tracker</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Log business expenses and track income vs expense balance.
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="card" style={{ padding: 16, minWidth: 150 }}>
          <div className="muted" style={{ fontSize: 11, textTransform: "uppercase" }}>This Month</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Income: <strong style={{ color: "#3FB68B" }}>₹{monthIncome.toLocaleString("en-IN")}</strong></div>
          <div style={{ fontSize: 13 }}>Expense: <strong style={{ color: "#E5484D" }}>₹{monthExp.toLocaleString("en-IN")}</strong></div>
          <div style={{ fontSize: 13, marginTop: 4, borderTop: "1px solid var(--border, #22303C)", paddingTop: 4 }}>
            Balance: <strong>₹{(monthIncome - monthExp).toLocaleString("en-IN")}</strong>
          </div>
        </div>
        <div className="card" style={{ padding: 16, minWidth: 150 }}>
          <div className="muted" style={{ fontSize: 11, textTransform: "uppercase" }}>This Year</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Income: <strong style={{ color: "#3FB68B" }}>₹{yearIncome.toLocaleString("en-IN")}</strong></div>
          <div style={{ fontSize: 13 }}>Expense: <strong style={{ color: "#E5484D" }}>₹{yearExp.toLocaleString("en-IN")}</strong></div>
          <div style={{ fontSize: 13, marginTop: 4, borderTop: "1px solid var(--border, #22303C)", paddingTop: 4 }}>
            Balance: <strong>₹{(yearIncome - yearExp).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 20, maxWidth: 520 }}>
        <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 12 }}>
          Add expense
        </div>
        <form action={addExpense}>
          <div className="field">
            <label>Category *</label>
            <select name="category" required>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Amount (₹) *</label>
            <input name="amount" type="number" step="0.01" required />
          </div>
          <div className="field">
            <label>Payment mode *</label>
            <select name="payment_mode" required>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="field">
            <label>Entry date *</label>
            <input name="entry_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="field">
            <label>Paid to (details)</label>
            <input name="paid_to" placeholder="Who was paid" />
          </div>
          <div className="field">
            <label>Authorised by</label>
            <input name="authorised_by" placeholder="Who approved this expense" />
          </div>
          <div className="field">
            <label>Notes</label>
            <input name="notes" placeholder="Optional" />
          </div>
          <button className="btn" type="submit">Add expense</button>
        </form>
      </div>

      <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", marginBottom: 10 }}>
        Recent expenses
      </div>
      {!allExpenses?.length ? (
        <p className="muted">No expenses logged yet.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Amount</th><th>Mode</th><th>Paid to</th><th>Authorised by</th><th></th></tr>
          </thead>
          <tbody>
            {allExpenses.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.entry_date).toLocaleDateString("en-IN")}</td>
                <td>{e.category}</td>
                <td>₹{Number(e.amount).toLocaleString("en-IN")}</td>
                <td style={{ textTransform: "capitalize" }}>{e.payment_mode}</td>
                <td>{e.paid_to || "—"}</td>
                <td>{e.authorised_by || "—"}</td>
                <td>
                  <form action={deleteExpense}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="btn-secondary" type="submit" style={{ fontSize: 12, padding: "4px 10px" }}>
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
