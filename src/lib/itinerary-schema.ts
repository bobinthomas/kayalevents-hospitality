export type FieldType = "single_select" | "multi_select" | "text";

export interface InfoBlock {
  id: string;
  kind: "info";
  /** Clock time range (HH:MM) this happens during. Either end may be blank; see `formatTimeRange`. */
  timeStart: string | null;
  timeEnd: string | null;
  title: string;
  content: string;
}

export interface FieldBlock {
  id: string;
  kind: "field";
  time: string | null;
  /** Clock time range (HH:MM) this is served/happens during — distinct from `time`, which holds the meal moment label (Breakfast/Lunch/…). Either end may be blank; see `formatTimeRange`. */
  servedAtStart: string | null;
  servedAtEnd: string | null;
  /** Optional instructional text shown between the title and the input — e.g. "Please outline your event day plan and assigned duties." */
  description?: string;
  title: string;
  field: {
    type: FieldType;
    required: boolean;
    options?: string[];
  };
}

/** "08:00 – 09:00" if both ends are set, just "08:00" if only one is, null if neither. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (start && end) return `${start} – ${end}`;
  return start || end || null;
}

/** Converts a stored 24h "HH:MM" clock time to 12h display form, e.g. "16:45" → "4:45 PM". */
export function to12Hour(time: string | null): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const hour = parseInt(hStr, 10);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${mStr} ${period}`;
}

export interface TransportEntry {
  vehicle: string;
  purpose: string;
}

export interface TransportBlock {
  id: string;
  kind: "transport";
  time: string | null;
  title: string;
  entries: TransportEntry[];
  details: string;
}

export type Block = InfoBlock | FieldBlock | TransportBlock;

export interface Section {
  id: string;
  date: string;
  label: string;
  blocks: Block[];
}

export interface ItinerarySchema {
  sections: Section[];
}

export type ResponseData = Record<string, string | string[]>;

/** Key under which a choice field's free-text "Special requirements" note is stored in ResponseData — kept alongside the choice itself rather than in the schema, so no migration is needed for existing forms. */
export function specialRequirementsKey(blockId: string): string {
  return `${blockId}__notes`;
}

/** Choice fields (single/multi select — cuisine, refreshments, etc.) get a companion "Special requirements" textarea; free-text fields (e.g. allergies) don't need one. */
export function isChoiceField(block: FieldBlock): boolean {
  return block.field.type !== "text";
}

export function fieldBlocksOf(schema: ItinerarySchema): FieldBlock[] {
  return schema.sections.flatMap((section) =>
    section.blocks.filter((block): block is FieldBlock => block.kind === "field")
  );
}

export function isFieldAnswered(field: FieldBlock["field"], value: string | string[] | undefined): boolean {
  if (field.type === "multi_select") return Array.isArray(value) && value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

/** Required field blocks with no (or empty) answer in responseData — used to block submission until answered. */
export function missingRequiredFields(schema: ItinerarySchema, responseData: ResponseData): FieldBlock[] {
  return fieldBlocksOf(schema).filter(
    (block) => block.field.required && !isFieldAnswered(block.field, responseData[block.id])
  );
}

/** True once every required field block in this one day has an answer — drives the step-wizard's per-day progress dots. */
export function isSectionComplete(section: Section, responseData: ResponseData): boolean {
  return section.blocks
    .filter((block): block is FieldBlock => block.kind === "field")
    .every((block) => !block.field.required || isFieldAnswered(block.field, responseData[block.id]));
}

/** Index of the day containing this block id, or -1 if not found — used to jump the wizard to the day with a missing required field. */
export function sectionIndexForBlock(sections: Section[], blockId: string): number {
  return sections.findIndex((section) => section.blocks.some((block) => block.id === blockId));
}

function blockStartTime(block: Block): string | null {
  if (block.kind === "info") return block.timeStart;
  if (block.kind === "field") return block.servedAtStart;
  return block.time;
}

/**
 * Chronological display order for a day's blocks, by start time (untimed
 * blocks sort last, original relative order preserved otherwise — relies on
 * Array#sort being stable). Derived at render time, same as `sortedSections`,
 * so blocks added out of order (or before times existed) still display
 * correctly everywhere without a data migration.
 */
export function sortedBlocks<T extends Block>(blocks: T[]): T[] {
  return [...blocks].sort((a, b) => (blockStartTime(a) ?? "99:99").localeCompare(blockStartTime(b) ?? "99:99"));
}
