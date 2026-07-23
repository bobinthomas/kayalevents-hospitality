// One-time script: tags an existing auth user as role "admin" in
// app_metadata (role is otherwise unset, which the app treats as
// "not configured yet" — see src/lib/supabase/roles.ts).
//
// Usage: node scripts/set-admin-role.mjs someone@example.com
// Reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from
// .env.local (same file the app itself uses) or the environment.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local not present — fall back to whatever is already in the environment.
  }
}

loadEnvLocal();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin-role.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

let userId = null;
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (match) {
    userId = match.id;
    break;
  }
  if (data.users.length < 200) break;
}

if (!userId) {
  console.error(`No auth user found for ${email}`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: { role: "admin" } });
if (error) throw error;

console.log(`${email} (${userId}) is now role: admin`);
