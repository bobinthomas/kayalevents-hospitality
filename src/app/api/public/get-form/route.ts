import { NextRequest, NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/runtime-env";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const functionsUrl = getRuntimeEnv("SUPABASE_EDGE_FUNCTIONS_URL");
  if (!functionsUrl) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const res = await fetch(`${functionsUrl}/get-form?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
