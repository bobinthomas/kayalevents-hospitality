// Deno Edge Function — deployed with --no-verify-jwt (artists are
// unauthenticated; the token itself is the auth mechanism).
import { createClient } from "npm:@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return json({ error: "token required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: form, error } = await supabase
    .from("artist_forms")
    .select("id, form_schema, response_data, status, deadline, opened_at, artists(name), events(name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !form) {
    return json({ error: "not found" }, 404);
  }

  const locked = form.status === "locked" || (form.deadline !== null && new Date(form.deadline) < new Date());

  // Best-effort side effect — don't block the read on this write.
  let status = form.status;
  if (form.status === "sent" && !form.opened_at) {
    const { error: openError } = await supabase
      .from("artist_forms")
      .update({ status: "opened", opened_at: new Date().toISOString() })
      .eq("id", form.id);
    if (!openError) status = "opened";
  }

  const artistName = (form.artists as unknown as { name: string } | null)?.name ?? "Artist";
  const eventName = (form.events as unknown as { name: string } | null)?.name ?? "Event";

  return json({
    artist_name: artistName,
    event_name: eventName,
    form_schema: form.form_schema,
    response_data: form.response_data,
    status,
    deadline: form.deadline,
    locked,
  });
});
