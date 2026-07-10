/** Long, unguessable, non-sequential token for artist form links. Server-only. */
export function generateFormToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID().slice(0, 8)}`;
}
