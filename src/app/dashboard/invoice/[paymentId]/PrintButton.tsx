"use client";

export function PrintButton() {
  return (
    <button className="btn no-print" style={{ marginBottom: 20 }} onClick={() => window.print()}>
      Download / Print Invoice
    </button>
  );
}
