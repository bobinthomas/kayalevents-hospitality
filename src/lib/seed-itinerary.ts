import type { ItinerarySchema } from "./itinerary-schema";
import { presetBlocksForDayType } from "./day-type-presets";

/**
 * Placeholder itinerary content, built from the same day-type presets the
 * "Add day" control uses. Replace with the real event dates/details via the
 * Templates tab — this stub only exists so the UI is testable before that
 * content lands, and everything here is editable/removable afterward.
 */
export function stubItinerarySchema(): ItinerarySchema {
  return {
    sections: [
      {
        id: crypto.randomUUID(),
        date: "2026-08-06",
        label: "Arrival",
        blocks: presetBlocksForDayType("Arrival"),
      },
      {
        id: crypto.randomUUID(),
        date: "2026-08-07",
        label: "Event Day",
        blocks: presetBlocksForDayType("Event Day"),
      },
      {
        id: crypto.randomUUID(),
        date: "2026-08-08",
        label: "Departure Day",
        blocks: presetBlocksForDayType("Departure Day"),
      },
    ],
  };
}
