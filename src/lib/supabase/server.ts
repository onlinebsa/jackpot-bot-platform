import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// NOTE: cookies() is async as of Next.js 15+ (mandatory from Next.js 16),
// so this factory function must be awaited by every caller:
//   const supabase = await createClient();
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies directly.
            // Safe to ignore here since we don't rely on session refresh mid-render.
          }
        },
      },
    }
  );
}
