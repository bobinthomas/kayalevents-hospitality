import {
  formatTimeRange,
  isFieldAnswered,
  specialRequirementsKey,
  sortedBlocks,
  to12Hour,
  type Block,
  type FieldBlock,
  type ItinerarySchema,
  type ResponseData,
  type Section,
} from "@/lib/itinerary-schema";
import { sortedSections } from "@/lib/day-type-presets";

/** How long a form can sit at `sent`/`opened` before it shows up in the Attention panel as stale. There's no dedicated "sent at" column, so `sent` staleness is measured from `updatedAt` (the only timestamp available without a schema change) and `opened` staleness from the accurate `openedAt`. */
const STALE_DAYS = 2;

export type ScheduleCategory = "travel" | "transportation";
export type MealCategory = "meals" | "refreshments";

/** Shared category → display label mapping, used by both the full-roster day view and the single-person day view so the grouping stays identical between them. */
export const SCHEDULE_GROUP_LABELS: { category: ScheduleCategory | null; label: string }[] = [
  { category: null, label: "Other" },
  { category: "travel", label: "Travel (Flights)" },
  { category: "transportation", label: "Transportation (To & Fro)" },
];

/** Info/transport blocks are categorized by kind + title keyword — there's no category field on the block itself (no schema change), so this is a heuristic, not stored data. Hotel check-in/out counts as Transportation (it's part of the arrival/departure journey), and anything that doesn't match (Rehearsal time, Break time, …) is left uncategorized on purpose rather than forced into one of the four buckets. */
function classifyScheduleBlock(block: Block): ScheduleCategory | null {
  if (block.kind === "transport") return "transportation";
  if (block.kind === "info") {
    if (/flight|baggage/i.test(block.title)) return "travel";
    if (/hotel/i.test(block.title)) return "transportation";
  }
  return null;
}

/** Same heuristic idea for choice-type field blocks — Breakfast/Lunch/Dinner (however titled) are Meals, everything else (Refreshments upon arrival, Rehearsal Refreshments, Green Room Hospitality, …) is Refreshments. */
function classifyMealBlock(title: string): MealCategory {
  return /breakfast|lunch|dinner|\bmeal\b/i.test(title) ? "meals" : "refreshments";
}

export type PersonStatus = "confirmed" | "pending";

export interface RosterMember {
  artistId: string;
  artistName: string;
  artistRole: string;
  phone: string | null;
  email: string | null;
}

export interface FormRecord {
  formId: string;
  artistId: string;
  artistName: string;
  artistRole: string;
  status: string;
  hasResponded: boolean;
  deadline: string | null;
  updatedAt: string | null;
  openedAt: string | null;
  submittedAt: string | null;
  schema: ItinerarySchema;
  responseData: ResponseData;
}

export interface PersonChip {
  artistName: string;
  artistRole: string;
  status: PersonStatus;
}

export interface ActivityRow {
  id: string;
  time: string | null;
  title: string;
  detail: string;
  category: ScheduleCategory | null;
  people: PersonChip[];
  isWholeRoster: boolean;
  isUniformStatus: boolean;
  collapsedSummary?: string;
}

export interface FlaggedNote {
  artistName: string;
  mealTitles: string[];
  note: string;
}

export interface MealMatrix {
  slots: string[];
  people: { artistName: string }[];
  cells: Record<string, Record<string, string | null>>;
}

export interface DaySection {
  label: string;
  date: string;
  totalPeople: number;
  confirmedCount: number;
  activities: ActivityRow[];
  meals: MealMatrix;
  refreshments: MealMatrix;
  flaggedNotes: FlaggedNote[];
}

export type AttentionAction = "send" | "nudge" | "review";

export interface AttentionItem {
  formId: string;
  artistName: string;
  artistRole: string;
  reason: string;
  action: AttentionAction;
}

export interface StatusStripMetrics {
  responded: { count: number; total: number };
  unconfirmedItems: number;
  needsAction: number;
  nextMilestone: { dayLabel: string; date: string; time: string | null } | null;
}

export interface PersonDayItinerary {
  label: string;
  date: string;
  activities: ActivityRow[];
  meals: { slot: string; selection: string | null }[];
  refreshments: { slot: string; selection: string | null }[];
}

export interface PersonItinerary {
  artistName: string;
  artistRole: string;
  hasResponded: boolean;
  days: PersonDayItinerary[];
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

/** Raw 24h "HH:MM" (or a range) — used only for grouping/sorting, never rendered. 12h conversion happens once, at display time, in `buildActivityRows`. */
function scheduleBlockSortTime(block: Block): string | null {
  if (block.kind === "info") return block.timeStart ?? block.timeEnd;
  if (block.kind === "transport") return block.time;
  return null;
}

function scheduleBlockDisplayTime(block: Block): string | null {
  if (block.kind === "info") return formatTimeRange(to12Hour(block.timeStart), to12Hour(block.timeEnd));
  if (block.kind === "transport") return to12Hour(block.time);
  return null;
}

function scheduleBlockDetail(block: Block): string {
  if (block.kind === "info") return block.content;
  if (block.kind === "transport") {
    return [block.entries.map((e) => `${e.vehicle} — ${e.purpose}`).join("; "), block.details]
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

/** Chronological title order for a day, taken from whichever form has the most blocks for it (so an activity that only exists on some artists' forms still gets a sensible slot) — reuses the same forward-fill `sortedBlocks` already trusted for the artist-facing form, so "Transport after baggage collection" stays true here too. */
function canonicalOrder(forms: FormRecord[], dayLabel: string): string[] {
  let best: Section | null = null;
  for (const form of forms) {
    const section = sortedSections(form.schema.sections).find((s) => s.label === dayLabel);
    if (section && (!best || section.blocks.length > best.blocks.length)) best = section;
  }
  if (!best) return [];
  return sortedBlocks(best.blocks.filter((b) => b.kind !== "field")).map((b) => b.title);
}

function dayLabelsOf(forms: FormRecord[]): { label: string; date: string }[] {
  const seen = new Set<string>();
  const labels: { label: string; date: string }[] = [];
  for (const form of forms) {
    for (const section of sortedSections(form.schema.sections)) {
      if (!seen.has(section.label)) {
        seen.add(section.label);
        labels.push({ label: section.label, date: section.date });
      }
    }
  }
  return labels;
}

function buildActivityRows(dayLabel: string, forms: FormRecord[], roster: RosterMember[]): ActivityRow[] {
  const groups = new Map<string, ActivityRow>();
  const sortTimes = new Map<string, string | null>();

  for (const form of forms) {
    const section = sortedSections(form.schema.sections).find((s) => s.label === dayLabel);
    if (!section) continue;

    for (const block of section.blocks) {
      if (block.kind === "field") continue;
      const sortTime = scheduleBlockSortTime(block);
      const key = `${block.title}::${sortTime ?? ""}`;
      const row =
        groups.get(key) ??
        ({
          id: key,
          time: scheduleBlockDisplayTime(block),
          title: block.title,
          detail: scheduleBlockDetail(block),
          category: classifyScheduleBlock(block),
          people: [],
          isWholeRoster: false,
          isUniformStatus: false,
        } satisfies ActivityRow);
      row.people.push({
        artistName: form.artistName,
        artistRole: form.artistRole,
        status: form.hasResponded ? "confirmed" : "pending",
      });
      groups.set(key, row);
      sortTimes.set(key, sortTime);
    }
  }

  const order = canonicalOrder(forms, dayLabel);
  const rows = [...groups.values()].sort((a, b) => {
    const ai = order.indexOf(a.title);
    const bi = order.indexOf(b.title);
    if (ai !== bi) return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
    return (sortTimes.get(a.id) ?? "").localeCompare(sortTimes.get(b.id) ?? "");
  });

  return rows.map((row) => {
    const isWholeRoster = row.people.length === roster.length && roster.length > 0;
    const isUniformStatus = isWholeRoster && row.people.every((p) => p.status === row.people[0].status);
    let collapsedSummary: string | undefined;
    if (isUniformStatus) {
      const confirmed = row.people.filter((p) => p.status === "confirmed").length;
      collapsedSummary =
        confirmed === row.people.length
          ? `All ${row.people.length} · confirmed`
          : `All ${row.people.length} · ${row.people.length - confirmed} pending confirmation`;
    }
    return { ...row, isWholeRoster, isUniformStatus, collapsedSummary };
  });
}

function isMealField(block: Block): block is FieldBlock {
  return block.kind === "field" && block.field.type !== "text";
}

/** Meal slot order for a day, taken from whichever form has the most blocks for it — same rationale as `canonicalOrder`, but scoped to choice-type field blocks (meal/refreshment questions) in one category. */
function canonicalMealOrder(forms: FormRecord[], dayLabel: string, category: MealCategory): string[] {
  let best: Section | null = null;
  for (const form of forms) {
    const section = sortedSections(form.schema.sections).find((s) => s.label === dayLabel);
    if (section && (!best || section.blocks.length > best.blocks.length)) best = section;
  }
  if (!best) return [];
  return sortedBlocks(best.blocks.filter((b) => isMealField(b) && classifyMealBlock(b.title) === category)).map(
    (b) => b.title
  );
}

function buildMealMatrix(dayLabel: string, forms: FormRecord[], roster: RosterMember[], category: MealCategory): MealMatrix {
  const slotOrder = canonicalMealOrder(forms, dayLabel, category);
  const cells: Record<string, Record<string, string | null>> = {};
  for (const slot of slotOrder) cells[slot] = {};

  for (const form of forms) {
    const section = sortedSections(form.schema.sections).find((s) => s.label === dayLabel);
    if (!section) continue;
    for (const block of section.blocks.filter(isMealField).filter((b) => classifyMealBlock(b.title) === category)) {
      if (!slotOrder.includes(block.title)) {
        slotOrder.push(block.title);
        cells[block.title] = {};
      }
      const value = form.responseData[block.id];
      const selection = isFieldAnswered(block.field, value)
        ? Array.isArray(value)
          ? value.join(", ")
          : (value as string)
        : null;
      cells[block.title][form.artistName] = selection;
    }
  }

  return {
    slots: slotOrder,
    people: roster.map((r) => ({ artistName: r.artistName })),
    cells,
  };
}

function buildFlaggedNotes(dayLabel: string, forms: FormRecord[]): FlaggedNote[] {
  const map = new Map<string, FlaggedNote>();
  for (const form of forms) {
    const section = sortedSections(form.schema.sections).find((s) => s.label === dayLabel);
    if (!section) continue;
    for (const block of section.blocks.filter(isMealField)) {
      const note = form.responseData[specialRequirementsKey(block.id)];
      if (typeof note === "string" && note.trim().length > 0) {
        const trimmed = note.trim();
        const key = `${form.artistName}::${trimmed}`;
        const existing = map.get(key) ?? { artistName: form.artistName, mealTitles: [], note: trimmed };
        existing.mealTitles.push(block.title);
        map.set(key, existing);
      }
    }
  }
  return [...map.values()];
}

/** The core day-by-day view model — one DaySection per day, activities grouped by (title, time) so identical logistics across the whole roster render once, not once per person. */
export function buildDaySections(forms: FormRecord[], roster: RosterMember[]): DaySection[] {
  return dayLabelsOf(forms).map(({ label, date }) => {
    const confirmedCount = forms.filter(
      (f) => f.hasResponded && sortedSections(f.schema.sections).some((s) => s.label === label)
    ).length;
    return {
      label,
      date,
      totalPeople: roster.length,
      confirmedCount,
      activities: buildActivityRows(label, forms, roster),
      meals: buildMealMatrix(label, forms, roster, "meals"),
      refreshments: buildMealMatrix(label, forms, roster, "refreshments"),
      flaggedNotes: buildFlaggedNotes(label, forms),
    };
  });
}

/** Roster members with no form generated at all — invisible to every other builder here since they carry no schema to walk. */
export function rosterWithoutForms(roster: RosterMember[], forms: FormRecord[]): RosterMember[] {
  const withForm = new Set(forms.map((f) => f.artistId));
  return roster.filter((r) => !withForm.has(r.artistId));
}

export function buildAttentionItems(forms: FormRecord[], daySections: DaySection[]): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const form of forms) {
    if (form.hasResponded) continue;

    if (form.status === "draft") {
      items.push({
        formId: form.formId,
        artistName: form.artistName,
        artistRole: form.artistRole,
        reason: "Never sent",
        action: "send",
      });
      continue;
    }

    if (form.status === "sent") {
      const since = daysSince(form.updatedAt);
      if (since !== null && since >= STALE_DAYS) {
        items.push({
          formId: form.formId,
          artistName: form.artistName,
          artistRole: form.artistRole,
          reason: `Sent ${Math.floor(since)} day${Math.floor(since) === 1 ? "" : "s"} ago, not opened`,
          action: "nudge",
        });
      }
      continue;
    }

    if (form.status === "opened") {
      const since = daysSince(form.openedAt);
      if (since !== null && since >= STALE_DAYS) {
        items.push({
          formId: form.formId,
          artistName: form.artistName,
          artistRole: form.artistRole,
          reason: `Opened ${Math.floor(since)} day${Math.floor(since) === 1 ? "" : "s"} ago, not submitted`,
          action: "nudge",
        });
      }
    }
  }

  // There's no "acknowledged" flag for a flagged note without a schema change,
  // so every flagged note is treated as needing review until an admin acts on it.
  const byArtist = new Map<string, { role: string; formId: string; titles: Set<string> }>();
  for (const day of daySections) {
    for (const note of day.flaggedNotes) {
      const form = forms.find((f) => f.artistName === note.artistName);
      if (!form) continue;
      const entry = byArtist.get(note.artistName) ?? { role: form.artistRole, formId: form.formId, titles: new Set() };
      for (const title of note.mealTitles) entry.titles.add(title);
      byArtist.set(note.artistName, entry);
    }
  }
  for (const [artistName, entry] of byArtist) {
    items.push({
      formId: entry.formId,
      artistName,
      artistRole: entry.role,
      reason: `Dietary/special-requirement note on ${[...entry.titles].join(", ")}`,
      action: "review",
    });
  }

  return items;
}

export function buildStatusStrip(
  roster: RosterMember[],
  forms: FormRecord[],
  daySections: DaySection[],
  attentionItems: AttentionItem[]
): StatusStripMetrics {
  const responded = forms.filter((f) => f.hasResponded).length;

  let unconfirmedItems = 0;
  for (const day of daySections) {
    for (const activity of day.activities) {
      unconfirmedItems += activity.people.filter((p) => p.status === "pending").length;
    }
    const pendingPeople = day.meals.people.filter((person) => {
      const form = forms.find((f) => f.artistName === person.artistName);
      return form && !form.hasResponded;
    }).length;
    unconfirmedItems += (day.meals.slots.length + day.refreshments.slots.length) * pendingPeople;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = daySections.find((d) => d.date >= todayIso) ?? daySections[0] ?? null;
  const nextMilestone = upcoming
    ? {
        dayLabel: upcoming.label,
        date: upcoming.date,
        time: upcoming.activities.find((a) => a.time)?.time ?? null,
      }
    : null;

  return {
    responded: { count: responded, total: roster.length },
    unconfirmedItems,
    needsAction: attentionItems.length,
    nextMilestone,
  };
}

export function buildPersonItinerary(artistName: string, forms: FormRecord[], daySections: DaySection[]): PersonItinerary | null {
  const form = forms.find((f) => f.artistName === artistName);
  if (!form) return null;

  const days: PersonDayItinerary[] = daySections.map((day) => ({
    label: day.label,
    date: day.date,
    activities: day.activities.filter((a) => a.people.some((p) => p.artistName === artistName)),
    meals: day.meals.slots.map((slot) => ({ slot, selection: day.meals.cells[slot]?.[artistName] ?? null })),
    refreshments: day.refreshments.slots.map((slot) => ({
      slot,
      selection: day.refreshments.cells[slot]?.[artistName] ?? null,
    })),
  }));

  return {
    artistName: form.artistName,
    artistRole: form.artistRole,
    hasResponded: form.hasResponded,
    days,
  };
}

