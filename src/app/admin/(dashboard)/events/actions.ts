"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createEvent(formData: FormData) {
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
