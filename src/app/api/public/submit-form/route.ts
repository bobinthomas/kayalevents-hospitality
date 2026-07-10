import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

export async function POST(request: NextRequest) {
  let body: { token?: string; response_data?: unknown; turnstile_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.token || !body.response_data) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const functionsUrl = getRuntimeEnv("SUPABASE_EDGE_FUNCTIONS_URL");
  if (!functionsUrl) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const res = await fetch(`${functionsUrl}/submit-form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
