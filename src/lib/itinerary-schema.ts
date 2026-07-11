export type FieldType = "single_select" | "multi_select" | "text";

export interface InfoBlock {
  id: string;
  kind: "info";
  time: string | null;
  title: string;
  content: string;
}

export interface FieldBlock {
  id: string;
  kind: "field";
  time: string | null;
  title: string;
  field: {
    type: FieldType;
    required: boolean;
    options?: string[];
  };
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
