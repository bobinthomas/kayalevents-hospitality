import type { StatusStripMetrics } from "@/lib/plan-view-model";
import { to12Hour } from "@/lib/itinerary-schema";

function Card({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: "neutral" | "warning" | "danger";
}) {
  const tintClass =
    tint === "danger"
      ? "border-coral/40 bg-coral/10"
      : tint === "warning"
        ? "border-ocean/40 bg-ocean/10"
        : "border-border bg-surface";

  return (
    <div className={`rounded-lg border px-4 py-3 ${tintClass}`}>
      <div className="text-xs text-sand-muted">{label}</div>
      <div className="text-[22px] font-bold text-sand">{value}</div>
    </div>
  );
}

export function StatusStrip({ metrics }: { metrics: StatusStripMetrics }) {
  const milestoneTime = metrics.nextMilestone?.time ? to12Hour(metrics.nextMilestone.time) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card
        label="Responded"
        value={`${metrics.responded.count} / ${metrics.responded.total}`}
        tint="neutral"
      />
      <Card
        label="Unconfirmed items"
        value={String(metrics.unconfirmedItems)}
        tint={metrics.unconfirmedItems > 0 ? "warning" : "neutral"}
      />
      <Card
        label="Needs action"
        value={String(metrics.needsAction)}
        tint={metrics.needsAction > 0 ? "danger" : "neutral"}
      />
      <Card
        label="Next milestone"
        value={
          metrics.nextMilestone
            ? `${metrics.nextMilestone.dayLabel}${milestoneTime ? ` · ${milestoneTime}` : ""}`
            : "—"
        }
        tint="neutral"
      />
    </div>
  );
}
