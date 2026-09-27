"use server";

import { redirect } from "next/navigation";
import { setAdminSessionCookie } from "@/lib/adminAuth";

export async function adminLogin(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const validUsername = process.env.ADMIN_USERNAME || "";
  const validPassword = process.env.ADMIN_PASSWORD || "";

  if (!validUsername || !validPassword) {
    return { error: "Admin credentials are not configured on the server (ADMIN_USERNAME / ADMIN_PASSWORD missing)." };
  }

  if (username !== validUsername || password !== validPassword) {
    return { error: "Invalid admin username or password." };
  }

  await setAdminSessionCookie();
  redirect("/admin");
}
