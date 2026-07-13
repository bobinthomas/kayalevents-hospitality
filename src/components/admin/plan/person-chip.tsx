import type { PersonChip as PersonChipData } from "@/lib/plan-view-model";

/** A single person's confirmation state on one activity — a dot + tint, never repeated prose. Confirmed = that artist's form has been submitted; pending = it hasn't (their time here may still change). */
export function PersonChip({ person }: { person: PersonChipData }) {
  const confirmed = person.status === "confirmed";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        confirmed ? "bg-lagoon/20 text-lagoon-bright" : "bg-surface-raised text-sand-muted"
      }`}
      title={confirmed ? "Confirmed" : "Not yet submitted — may change"}
    >
      {confirmed && <span aria-hidden="true">✓</span>}
      {person.artistName}
    </span>
  );
}
