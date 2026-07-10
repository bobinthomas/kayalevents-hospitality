import { createClient } from "@supabase/supabase-js";
import { getRuntimeEnv } from "@/lib/runtime-env";

/**
 * Service-role Supabase client — bypasses RLS entirely by design.
 * Server-only (route handlers). Used for:
 *  - proxying to the get-form/submit-form Edge Functions
 *  - Storage writes/reads for the PDF export bucket
 * Never import this from a Client Component.
 */
export function createAdminSupabaseClient() {
  const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role client is not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
