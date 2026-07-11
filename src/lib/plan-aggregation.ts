import {
  formatTimeRange,
  isFieldAnswered,
  specialRequirementsKey,
  to12Hour,
  type FieldBlock,
  type ItinerarySchema,
  type ResponseData,
} from "@/lib/itinerary-schema";
import { sortedSections } from "@/lib/day-type-presets";

export interface ArtistFormInput {
  artistName: string;
  artistRole: string;
  hasResponded: boolean;
  schema: ItinerarySchema;
  responseData: ResponseData;
}

export interface ScheduleEntry {
  artistName: string;
  artistRole: string;
  time: string | null;
  title: string;
  content: string;
  hasResponded: boolean;
}

export interface ChoiceTally {
  title: string;
  tally: { option: string; count: number }[];
  notes: { artistName: string; note: string }[];
}

export interface FreeTextGroup {
  title: string;
  answers: { artistName: string; answer: string }[];
}

export interface DayPlan {
  label: string;
  date: string;
  schedule: ScheduleEntry[];
  choices: ChoiceTally[];
  freeText: FreeTextGroup[];
}

export interface NonResponder {
  artistName: string;
  artistRole: string;
  phone: string | null;
  email: string | null;
  status: string;
  deadline: string | null;
}

/** Raw "HH:MM" (or null) used purely for sort order — nulls sort last. */
function sortKey(time: string | null): string {
  return time ?? "99:99";
}

/** Rolls every artist's form schema + responses up into a day-by-day operational view, grouped by (day label, block title) so it's robust to block ids drifting across independently-edited per-artist forms. */
export function buildPlan(forms: ArtistFormInput[]): DayPlan[] {
  const dayLabels: { label: string; date: string }[] = [];
  const seenLabels = new Set<string>();

  for (const form of forms) {
    for (const section of sortedSections(form.schema.sections)) {
      if (!seenLabels.has(section.label)) {
        seenLabels.add(section.label);
        dayLabels.push({ label: section.label, date: section.date });
      }
    }
  }

  return dayLabels.map(({ label, date }) => {
    const schedule: ScheduleEntry[] = [];
    const choiceMap = new Map<string, ChoiceTally>();
    const freeTextMap = new Map<string, FreeTextGroup>();

    for (const form of forms) {
      const section = sortedSections(form.schema.sections).find((s) => s.label === label);
      if (!section) continue;

      for (const block of section.blocks) {
        if (block.kind === "info") {
          const time = formatTimeRange(to12Hour(block.timeStart), to12Hour(block.timeEnd));
          schedule.push({
            artistName: form.artistName,
            artistRole: form.artistRole,
            time,
            title: block.title,
            content: block.content,
            hasResponded: form.hasResponded,
          });
        } else if (block.kind === "transport") {
          const time = to12Hour(block.time);
          const content = [
            block.entries.map((e) => `${e.vehicle} — ${e.purpose}`).join("; "),
            block.details,
          ]
            .filter(Boolean)
            .join(" · ");
          schedule.push({
            artistName: form.artistName,
            artistRole: form.artistRole,
            time,
            title: block.title,
            content,
            hasResponded: form.hasResponded,
          });
        } else {
          addFieldBlock(block, form, choiceMap, freeTextMap);
        }
      }
    }

    schedule.sort((a, b) => sortKey(a.time).localeCompare(sortKey(b.time)));

    return {
      label,
      date,
      schedule,
      choices: [...choiceMap.values()],
      freeText: [...freeTextMap.values()],
    };
  });
}

function addFieldBlock(
  block: FieldBlock,
  form: ArtistFormInput,
  choiceMap: Map<string, ChoiceTally>,
  freeTextMap: Map<string, FreeTextGroup>
) {
  const value = form.responseData[block.id];
  if (!isFieldAnswered(block.field, value)) return;

  if (block.field.type === "text") {
    const group = freeTextMap.get(block.title) ?? { title: block.title, answers: [] };
    group.answers.push({ artistName: form.artistName, answer: value as string });
    freeTextMap.set(block.title, group);
    return;
  }

  const tally = choiceMap.get(block.title) ?? { title: block.title, tally: [], notes: [] };
  const options = Array.isArray(value) ? value : [value];
  for (const option of options) {
    const existing = tally.tally.find((t) => t.option === option);
    if (existing) existing.count += 1;
    else tally.tally.push({ option, count: 1 });
  }
  const note = form.responseData[specialRequirementsKey(block.id)];
  if (typeof note === "string" && note.trim().length > 0) {
    tally.notes.push({ artistName: form.artistName, note });
  }
  choiceMap.set(block.title, tally);
}

export function buildNonResponders(
  forms: (ArtistFormInput & {
    phone: string | null;
    email: string | null;
    status: string;
    deadline: string | null;
  })[]
): NonResponder[] {
  return forms
    .filter((f) => !f.hasResponded)
    .map((f) => ({
      artistName: f.artistName,
      artistRole: f.artistRole,
      phone: f.phone,
      email: f.email,
      status: f.status,
      deadline: f.deadline,
    }));
}
