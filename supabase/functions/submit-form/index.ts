// Deno Edge Function — deployed with --no-verify-jwt (artists are
// unauthenticated; the token itself is the auth mechanism).
import { createClient } from "npm:@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

interface SubmitBody {
  token?: string;
  response_data?: Record<string, unknown>;
  turnstile_token?: string;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return true; // skip in dev if no secret configured — matches the existing kayalevents repo's convention

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid request body" }, 400);
  }

  const { token, response_data: responseData, turnstile_token: turnstileToken } = body;
  if (!token || !responseData || typeof responseData !== "object") {
    return json({ error: "token and response_data are required" }, 400);
  }
  if (Deno.env.get("TURNSTILE_SECRET") && !turnstileToken) {
    return json({ error: "turnstile_token is required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: form, error } = await supabase
    .from("artist_forms")
    .select("id, form_schema, status, deadline")
    .eq("token", token)
    .maybeSingle();

  if (error || !form) {
    return json({ error: "not found" }, 404);
  }

  const locked = form.status === "locked" || (form.deadline !== null && new Date(form.deadline) < new Date());
  if (locked) {
    return json({ error: "form is locked" }, 409);
  }

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "";
  const turnstileOk = await verifyTurnstile(turnstileToken ?? "", ip);
  if (!turnstileOk) {
    return json({ error: "turnstile verification failed" }, 403);
  }

  // Tamper check: only accept keys that correspond to a "field" block in
  // this form's schema — cheap membership check, not full per-type validation.
  interface SchemaFieldBlock {
    id: string;
    kind: string;
    title: string;
    field?: { type: string; required: boolean };
  }
  const schema = form.form_schema as { sections: { blocks: SchemaFieldBlock[] }[] };
  const fieldBlocks = schema.sections.flatMap((section) => section.blocks.filter((b) => b.kind === "field"));
  // Choice fields (single/multi select) also accept a "<id>__notes" companion
  // key for the free-text "Special requirements" box — not its own schema
  // block, so it's allowed explicitly here rather than via allowedKeys alone.
  const allowedKeys = new Set(fieldBlocks.map((b) => b.id));
  const allowedNotesKeys = new Set(
    fieldBlocks.filter((b) => b.field?.type !== "text").map((b) => `${b.id}__notes`)
  );
  const filteredResponse: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(responseData)) {
    if (allowedKeys.has(key) || allowedNotesKeys.has(key)) filteredResponse[key] = value;
  }

  // Required-field validation — client-side JS can be bypassed, so this is
  // the actual enforcement, not just a UX nicety.
  const missingRequired = fieldBlocks.filter((block) => {
    if (!block.field?.required) return false;
    const value = filteredResponse[block.id];
    if (block.field.type === "multi_select") return !Array.isArray(value) || value.length === 0;
    return typeof value !== "string" || value.trim().length === 0;
  });
  if (missingRequired.length > 0) {
    return json(
      { error: `Missing required fields: ${missingRequired.map((b) => b.title).join(", ")}` },
      400
    );
  }

  const { error: updateError } = await supabase
    .from("artist_forms")
    .update({
      response_data: filteredResponse,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", form.id);

  if (updateError) {
    return json({ error: "failed to save response" }, 500);
  }

  // Pre-warm the admin's PDF export for this submission — best-effort, never
  // blocks or fails the artist's submission. EdgeRuntime.waitUntil lets this
  // keep running after the response below is sent, instead of being cut off.
  const appUrl = Deno.env.get("HOSPITALITY_APP_URL");
  const internalSecret = Deno.env.get("INTERNAL_API_SECRET");
  if (appUrl && internalSecret) {
    const generatePdf = fetch(`${appUrl}/api/internal/generate-submission-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": internalSecret },
      body: JSON.stringify({ formId: form.id }),
    }).catch((err) => console.error("generate-submission-pdf failed", err));

    // @ts-expect-error - EdgeRuntime is a Supabase Edge Functions global, not in Deno's lib types
    if (typeof EdgeRuntime !== "undefined") {
      // @ts-expect-error - see above
      EdgeRuntime.waitUntil(generatePdf);
    } else {
      await generatePdf;
    }
  }

  return json({ ok: true });
});
