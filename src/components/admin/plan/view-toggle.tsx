export type PlanView = "day" | "person";

export function ViewToggle({ view, onChange }: { view: PlanView; onChange: (view: PlanView) => void }) {
  return (
    <div className="inline-flex rounded border border-border bg-surface p-0.5 text-sm">
      {(["day", "person"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded px-3 py-1 ${
            view === v ? "bg-coral text-sand" : "text-sand-muted hover:text-sand"
          }`}
        >
          {v === "day" ? "By day" : "By person"}
        </button>
      ))}
    </div>
  );
}
