import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase client — used only by the admin login page and
 * other client components under /admin. The public /f/[token] artist
 * flow never uses this; it talks to Next.js API routes instead (see
 * src/app/api/public/*), since anon has zero table grants anyway.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
