import type { Block, Section } from "./itinerary-schema";

export const DAY_TYPES = ["Arrival", "Rehearsal Day", "Event Day", "Departure Day", "Custom"] as const;
export type DayType = (typeof DAY_TYPES)[number];

/** Canonical stage rank (Arrival → Rehearsal → Event → Departure). Unrecognized/custom labels sort after all of these, by date. */
function dayTypeRank(label: string): number {
  const index = DAY_TYPES.findIndex((type) => type === label);
  return index === -1 ? DAY_TYPES.length : index;
}

/**
 * Canonical display order for a schema's days: by stage first (so a
 * mistyped/placeholder date can't knock Arrival out of first place), then by
 * date within the same stage. Applied at read/render time everywhere days
 * are listed (admin builder, artist page, responses view, PDF export) so
 * display order is correct regardless of what order is actually stored.
 */
export function sortedSections<T extends Pick<Section, "date" | "label">>(sections: T[]): T[] {
  return [...sections].sort((a, b) => {
    const rankDiff = dayTypeRank(a.label) - dayTypeRank(b.label);
    return rankDiff !== 0 ? rankDiff : a.date.localeCompare(b.date);
  });
}

export const VEHICLE_TYPES = ["Car", "Van", "Minibus", "Other"];
export const PURPOSE_OPTIONS = [
  "Airport pickup",
  "Hotel transfer",
  "Venue transfer",
  "Departure drop-off",
  "Other",
];

export const MEAL_MOMENTS = ["Refreshments upon arrival", "Breakfast", "Lunch", "Dinner", "Custom"] as const;
export type MealMoment = (typeof MEAL_MOMENTS)[number];

/** Canned option-sets an admin can pick from when building a Food & refreshments row. */
export const OPTION_SETS: Record<string, { label: string; options: string[] }> = {
  cuisine: {
    label: "Cuisine (Indian / Kerala / Continental)",
    options: ["Indian Cuisine", "Kerala Cuisine", "Continental / English Cuisine"],
  },
  refreshments: {
    label: "Refreshments (Tea / Coffee / Juice / Water / None)",
    options: ["Tea", "Coffee", "Juice", "Water", "None"],
  },
  custom: { label: "Custom options…", options: [] },
};

const CUISINE_OPTIONS = OPTION_SETS.cuisine.options;

function cuisineField(meal: "Breakfast" | "Lunch" | "Dinner"): Block {
  return {
    id: crypto.randomUUID(),
    kind: "field",
    time: meal,
    servedAtStart: null,
    servedAtEnd: null,
    title: `${meal} cuisine preference`,
    field: { type: "single_select", required: true, options: CUISINE_OPTIONS },
  };
}

function transportBlock(title: string, purpose: string): Block {
  return {
    id: crypto.randomUUID(),
    kind: "transport",
    time: null,
    title,
    entries: [{ vehicle: "Car", purpose }],
    details: "",
  };
}

/** Starting block set for a newly added day, keyed by day type. Fully editable afterward — add/remove/edit blocks freely once seeded. */
export function presetBlocksForDayType(dayType: DayType): Block[] {
  switch (dayType) {
    case "Arrival":
      return [
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Flight arrival",
          content: "",
        },
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Expected baggage collection & exit",
          content: "",
        },
        transportBlock("Transport arrangement", "Airport pickup"),
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Estimated arrival at hotel",
          content: "",
        },
        {
          id: crypto.randomUUID(),
          kind: "field",
          time: null,
          servedAtStart: null,
          servedAtEnd: null,
          title: "Refreshments upon arrival",
          field: { type: "single_select", required: false, options: OPTION_SETS.refreshments.options },
        },
        cuisineField("Dinner"),
        {
          id: crypto.randomUUID(),
          kind: "field",
          time: null,
          servedAtStart: null,
          servedAtEnd: null,
          title: "Allergies / dietary requirements",
          hiddenFromArtist: true,
          field: { type: "text", required: false },
        },
      ];
    case "Rehearsal Day":
      return [
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Rehearsal time",
          content: "",
        },
        cuisineField("Breakfast"),
        cuisineField("Lunch"),
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Break time",
          content: "",
        },
        cuisineField("Dinner"),
        {
          id: crypto.randomUUID(),
          kind: "field",
          time: null,
          servedAtStart: null,
          servedAtEnd: null,
          title: "Allergies / dietary requirements",
          hiddenFromArtist: true,
          field: { type: "text", required: false },
        },
      ];
    case "Event Day":
      return [
        cuisineField("Breakfast"),
        cuisineField("Lunch"),
        cuisineField("Dinner"),
        {
          id: crypto.randomUUID(),
          kind: "field",
          time: null,
          servedAtStart: null,
          servedAtEnd: null,
          title: "Allergies / dietary requirements",
          hiddenFromArtist: true,
          field: { type: "text", required: false },
        },
        {
          id: crypto.randomUUID(),
          kind: "field",
          time: null,
          servedAtStart: null,
          servedAtEnd: null,
          title: "Venue Visit Plan Based on Individual Duties and Responsibilities for the Event Day",
          description: "Please outline your event day plan and assigned duties.",
          field: { type: "text", required: false },
        },
      ];
    case "Departure Day":
      return [
        cuisineField("Breakfast"),
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Hotel checkout time",
          content: "",
        },
        transportBlock("Transport to airport", "Departure drop-off"),
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Flight check-in",
          content: "",
        },
        {
          id: crypto.randomUUID(),
          kind: "info",
          timeStart: null,
          timeEnd: null,
          title: "Flight departure",
          content: "",
        },
      ];
    case "Custom":
    default:
      return [];
  }
}
