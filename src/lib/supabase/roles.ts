import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "event_user";

/**
 * Reads the caller's role from `app_metadata` (set only via the Admin API,
 * so unlike `user_metadata` it can't be forged by the signed-in user).
 * Server-only — never trust a role passed from the client.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role;
  return role === "admin" || role === "event_user" ? role : null;
}

export async function requireAdmin(): Promise<void> {
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    throw new Error("Admin access required");
  }
}
