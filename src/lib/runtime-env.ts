import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Read a Worker env var at runtime.
 * Uses bracket access so bundlers don't inline undefined at build time,
 * and falls back to Cloudflare `env` bindings when process.env is empty.
 */
export function getRuntimeEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;

  try {
    const fromWorker = getCloudflareContext().env[name as keyof CloudflareEnv];
    if (typeof fromWorker === "string" && fromWorker.length > 0) {
      return fromWorker;
    }
  } catch {
    // Outside Cloudflare (next dev / node scripts)
  }

  return undefined;
}

export function hasRuntimeEnv(name: string): boolean {
  return Boolean(getRuntimeEnv(name));
}
