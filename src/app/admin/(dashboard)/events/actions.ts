"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/roles";

export async function createEvent(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;

  if (!name) {
    throw new Error("Event name is required");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ name, location, start_date: startDate, end_date: endDate })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  redirect(`/admin/events/${data.id}/roster`);
}

/**
 * Finds an existing auth user by email or creates a new one, tags them as
 * an `event_user`, and assigns them to the given event. Reused (not
 * recreated) when the same email is assigned to a second event.
 */
export async function assignEventUser(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("event_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!eventId || !email || !password) {
    throw new Error("Event, email, and password are all required");
  }

  const admin = createAdminSupabaseClient();

  // supabase-js has no getUserByEmail — page through listUsers() and match.
  // Fine at this project's scale (a handful of admin/event-user accounts).
  let userId: string | null = null;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) {
      userId = match.id;
      break;
    }
    if (data.users.length < 200) break;
  }

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "event_user" },
    });
    if (error) throw new Error(error.message);
    userId = data.user.id;
  }

  const supabase = await createServerSupabaseClient();
  const { error: assignError } = await supabase
    .from("events")
    .update({ assigned_user_id: userId })
    .eq("id", eventId);
  if (assignError) throw new Error(assignError.message);

  revalidatePath("/admin");
}

export async function unassignEventUser(formData: FormData) {
  await requireAdmin();

  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) throw new Error("Event is required");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("events")
    .update({ assigned_user_id: null })
    .eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}
