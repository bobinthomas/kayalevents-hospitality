"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stubItinerarySchema } from "@/lib/seed-itinerary";
import type { ItinerarySchema } from "@/lib/itinerary-schema";

type Role = "lead" | "band" | "musician" | "crew";

export async function seedTemplate(eventId: string, role: Role) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("templates").insert({
    event_id: eventId,
    role,
    name: `${role} itinerary`,
    schema: stubItinerarySchema(),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}/templates`);
}

export async function saveTemplate(templateId: string, eventId: string, schema: ItinerarySchema) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("templates").update({ schema }).eq("id", templateId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/events/${eventId}/templates`);
}
