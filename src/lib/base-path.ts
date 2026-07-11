// Single source of truth for the app's basePath (see next.config.ts).
// Raw fetch() calls need this prefix manually — next/link, redirect(), and
// next/navigation are basePath-aware automatically, raw fetch() is not.
export const BASE_PATH = "/hospitality";
