const COLORS: Record<string, string> = {
  draft: "bg-surface-raised text-sand-muted",
  sent: "bg-ocean/20 text-ocean",
  opened: "bg-lagoon/20 text-lagoon-bright",
  submitted: "bg-lagoon/30 text-lagoon-bright",
  locked: "bg-surface-raised text-sand-muted",
};

export function StatusBadge({ status, deadline }: { status: string; deadline: string | null }) {
  const overdue =
    status !== "submitted" && status !== "locked" && deadline && new Date(deadline) < new Date();

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        overdue ? "bg-coral/20 text-coral-bright" : COLORS[status] ?? "bg-surface-raised text-sand-muted"
      }`}
    >
      {overdue ? "overdue" : status}
    </span>
  );
}
