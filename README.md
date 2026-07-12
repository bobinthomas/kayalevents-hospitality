# Kayal Events — Hospitality

Internal tool for collecting artist hospitality/itinerary preferences (flights, hotel, transport, meals, event-day duties) via a token-linked form, and rolling the responses up into an operational plan for the event manager.

Sibling app to the main [kayalevents.com.au](https://kayalevents.com.au) marketing site — separate repo, separate Supabase project, same deploy target (Cloudflare Workers via OpenNext).

- **Repo:** https://github.com/bobinthomas/kayalevents-hospitality
- **Live:** https://hospitality.kayalevents.com.au

## What it does

1. **Admin** creates an event, adds artists to the roster (with a role: lead / band / musician / crew), and builds a **template** per role — a day-by-day schedule of logistics blocks (flight, hotel, transport), food/refreshment choices, and free-text questions.
2. Admin **generates a form** for each artist from their role's template (a one-time snapshot — editing the template afterward does not retroactively change already-generated forms). For artists travelling together on an identical itinerary, admin can instead **copy another artist's plan** onto theirs and tweak just the differences.
3. Each artist gets a unique **token link** (`/f/[token]`, no login) — a step-wizard form, one day at a time, that they fill out and can reopen to update until the deadline.
4. On submission, a PDF of the completed itinerary is generated automatically and made ready for the admin to export. Admin can also review responses in-app, and once submissions are in, roll them up into a **Plan** view — a day-by-day operational rundown across all artists (schedule, meal headcounts, flagged notes, who hasn't responded yet).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4. Dev/build use `--webpack` (not Turbopack).
- **Deploy:** OpenNext + Cloudflare Workers (`npm run deploy`). Not Vercel. Custom domain routing is configured in `wrangler.jsonc`.
- **Backend:** Supabase — Postgres (RLS-scoped by `created_by = auth.uid()`), Auth (admin login only — artists are unauthenticated, the token *is* the auth), Storage (private bucket for PDF exports), and two Edge Functions (`get-form`, `submit-form`) that the public artist-facing page talks to.
- **PDF export:** `@react-pdf/renderer`, rendered server-side.

No `middleware.ts`/`proxy.ts` — Next 16 + OpenNext Cloudflare doesn't play well with them; auth session refresh happens in Server Components via `@supabase/ssr` cookie handling instead.

## Data model

```
events
  └─ artists          (name, role: lead|band|musician|crew, contact info)
  └─ templates         (one per role per event — schema is the source of truth
                         admins edit; JSONB: sections[] → blocks[])
  └─ artist_forms       (one per artist — a snapshot of a template's schema at
                         generation time, plus this artist's own responses)
```

- **Block kinds** inside a schema's `sections[].blocks[]`: `info` (admin-authored logistics note — e.g. Flight arrival, with a time range), `transport` (admin-authored vehicle/purpose), `field` (artist-answered — single/multi-select or free text; can carry a `hiddenFromArtist` flag for admin-only questions like Allergies, and a `description` shown as a footnote).
- **Ground truth for "has this artist responded"** is `submitted_at IS NOT NULL`, not `status` — `status` has drifted out of sync with reality in the past and shouldn't be trusted alone.
- Days/blocks are always sorted at **render time**, never assumed to be in stored order: `sortedSections` (Arrival → Rehearsal → Event → Departure, by stage then date) and `sortedBlocks` (chronological by time; untimed blocks inherit the last known time from their nearest preceding timed neighbor, so e.g. a Transport block with no clock time set still lands next to the logistics note it was authored beside, not at the bottom of the day).

See `src/lib/itinerary-schema.ts` for all of the above as pure, tested-by-use functions — every consumer (admin builder, artist page, responses view, Plan dashboard, PDF export) goes through them rather than reading `sections`/`blocks` raw.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase project values
npm run dev                  # http://localhost:3000
```

Provisioning a fresh Supabase project:

```bash
npx supabase link --project-ref <your-project-ref>
npm run supabase:migrate                          # runs supabase/migrations/*.sql
npm run supabase:functions:deploy                  # deploys get-form + submit-form (--no-verify-jwt)
```

Also needed, done once via the Supabase dashboard (not scripted — see comment in `supabase/migrations/0002_rls.sql`):

- Create a **private** Storage bucket named `hospitality-exports` (PDF exports land at `{event_id}/{artist_form_id}.pdf`).

### Environment variables

| Variable | Where it's set | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Cloudflare Worker `vars` | Browser/server Supabase client (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` + Cloudflare Worker **secret** | Admin/service client — bypasses RLS. Storage writes, proxying to Edge Functions |
| `SUPABASE_EDGE_FUNCTIONS_URL` | `.env.local` + Cloudflare Worker `vars` | Base URL the Next app calls the Edge Functions on |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` | `.env.local` (site key) + Supabase Edge Function secret (`TURNSTILE_SECRET`) | Bot protection on the public submit form. Verification is skipped entirely when unset (dev convenience) |
| `INTERNAL_API_SECRET` | Cloudflare Worker **secret** *and* Supabase Edge Function secret (must match) | Shared secret authenticating the `submit-form` Edge Function's server-to-server call into `/api/internal/generate-submission-pdf` — there's no admin session in that context, so this stands in for one |
| `HOSPITALITY_APP_URL` | Supabase Edge Function secret only | Tells `submit-form` where this app is deployed, so it knows where to POST the pre-warm call |

Env vars are read via `getRuntimeEnv()` (`src/lib/runtime-env.ts`), which checks `process.env` first and falls back to the Cloudflare Workers `env` binding — `process.env` alone can be empty at runtime on Workers.

## Admin flows

- **Templates** (`/admin/events/[eventId]/templates`) — one schema per role, edited via the shared `ItineraryEditor` block builder (also used for per-artist snapshot edits).
- **Roster** (`/admin/events/[eventId]/roster`) — add/edit artists.
- **Forms** (`/admin/events/[eventId]/forms`) — generate a form from the artist's role template, or **copy another artist's plan** onto theirs via the "Copy plan from…" control on each row (available whether or not they already have a form; overwriting an existing form's schedule requires confirming, and never touches that artist's own submitted answers). Each form's detail page is the same block editor, scoped to that one artist's snapshot, plus a deadline setter and manual **Export PDF** button.
- **Responses** (`/admin/events/[eventId]/responses`) — read-only view of each artist's submitted answers.
- **Plan** (`/admin/events/[eventId]/plan`) — day-by-day rollup across all artists once responses start coming in: schedule table, meal choice tallies with any special-requirements notes, flagged free-text answers (duties, allergies), and a chase-up list of who hasn't submitted yet. Pure aggregation logic lives in `src/lib/plan-aggregation.ts`, grouped by `(day label, block title)` rather than block id so it stays correct even as per-artist forms drift from their template over time.

## Artist-facing form (`/f/[token]`)

No login — the token in the URL is the credential. A step wizard, one day per step, with progress dots (complete / current / pending, clickable to jump). Required-field validation happens both client-side (for UX) and again server-side in the `submit-form` Edge Function (the real enforcement — client JS is trivially bypassable). Reopening the link after submitting lets the artist review/update answers until the deadline; past the deadline (or if an admin locks it) the form renders read-only.

## PDF export

- **Manual**: admin clicks **Export PDF** on a form's detail page → `/api/admin/forms/[id]/pdf` (session-authed) renders via `@react-pdf/renderer`, uploads to the `hospitality-exports` bucket, returns a 1-hour signed URL.
- **Automatic pre-warm on submission**: the `submit-form` Edge Function, after saving the response, fires a best-effort call (via `EdgeRuntime.waitUntil`, so it can't slow down or fail the artist's submission) to `/api/internal/generate-submission-pdf` — authenticated by the shared `INTERNAL_API_SECRET` header instead of an admin session — which renders the same PDF and uploads it to the same storage path ahead of time. By the time an admin opens the form, the export is already sitting there; clicking Export just re-renders (harmless, `upsert: true`) and hands back a fresh signed URL.
- Both routes share the actual rendering call, `generateFormPdfBuffer()` in `src/lib/pdf/generate-form-pdf.tsx`, so the PDF layout only lives in one place (`itinerary-pdf-document.tsx`).

### Deferred: emailing the PDF to the admin

The original ask was for the admin to be *emailed* the PDF the moment an artist submits, not just have it ready to download. That's deliberately **not implemented** — every option (Resend, Postmark, Brevo, Gmail SMTP) needed a new credential this project doesn't have yet, and it was decided not to block on setting one up. What's already in place makes adding it later a small, contained change:

- `/api/internal/generate-submission-pdf` already renders the PDF server-side on every submission — sending it is just adding an email call after the existing upload step.
- The `submit-form` → Next.js server-to-server auth path (`INTERNAL_API_SECRET`) is already wired and deployed, so no new plumbing between Deno and the app is needed.
- To pick this back up: choose a provider (Resend needs `kayalevents.com.au` DNS/DKIM verification; Postmark/Brevo need only a single verified sender address; Gmail SMTP needs no new account but requires a TCP-socket-based SMTP client since Cloudflare Workers has no native SMTP support), set its API key as a Cloudflare Worker secret, and add the send call to `generate-submission-pdf/route.ts` using the PDF buffer already produced there.

## Deployment

```bash
npm run deploy            # production (main branch) → hospitality.kayalevents.com.au
```

Custom domain routing lives in `wrangler.jsonc`. Cloudflare Worker secrets (`SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_API_SECRET`) are set once via `wrangler secret put <NAME>` and persist across deploys — only `vars` (non-secret) need updating in `wrangler.jsonc` itself. Edge Function changes (`supabase/functions/*`) are deployed separately via `npm run supabase:functions:deploy` (or `supabase functions deploy <name> --use-api` for a single function) — `npm run deploy` only ships the Next.js app.
