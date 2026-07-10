"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ROLES = ["lead", "band", "musician", "crew"] as const;

export async function addArtist(eventId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const isVip = formData.get("is_vip") === "on";
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!name) throw new Error("Artist name is required");
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    throw new Error("Valid role is required");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("artists").insert({
    event_id: eventId,
    name,
    role,
    is_vip: isVip,
    phone,
    email,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/events/${eventId}/roster`);
}
