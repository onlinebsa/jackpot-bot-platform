import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// This client uses the SERVICE ROLE key and bypasses Row Level Security.
// Import it ONLY inside server actions / route handlers that first verify
// the caller is an admin. Never import this file from client components.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
