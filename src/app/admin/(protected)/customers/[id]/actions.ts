"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Returns the new plaintext password so the admin can share it with the customer.
export async function resetCustomerPassword(userId: string): Promise<string> {
  await requireAdminSession();
  const newPassword = generatePassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw new Error(error.message);
  return newPassword;
}

export async function toggleTvAccess(userId: string, given: boolean): Promise<void> {
  await requireAdminSession();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ tv_access_given: given })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/customers/${userId}`);
}