"use server";

import { redirect } from "next/navigation";
import { clearAdminSessionCookie } from "@/lib/adminAuth";

export async function adminLogout() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
