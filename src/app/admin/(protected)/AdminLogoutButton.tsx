"use client";

import { adminLogout } from "./adminLogoutAction";

export function AdminLogoutButton() {
  return (
    <form action={adminLogout}>
      <button className="btn-secondary btn-sm" type="submit">Log out</button>
    </form>
  );
}
