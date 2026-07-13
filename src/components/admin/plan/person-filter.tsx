/** Above this roster size, pill buttons per person stop being scannable and just wrap into a wall of chips — switch to a dropdown instead. */
const CHIP_THRESHOLD = 8;

/** Secondary navigation, nested under the selected day — narrows that one day's content down to a single roster member instead of the whole roster. */
export function PersonFilter({
  people,
  selected,
  onSelect,
}: {
  people: string[];
  selected: string | null;
  onSelect: (person: string | null) => void;
}) {
  if (people.length === 0) return null;

  if (people.length > CHIP_THRESHOLD) {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor="plan-person-filter" className="text-xs text-sand-muted">
          View:
        </label>
        <select
          id="plan-person-filter"
          value={selected ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
          className="rounded border border-border bg-marine-black px-3 py-1.5 text-sm text-sand"
        >
          <option value="">All ({people.length})</option>
          {people.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-sand-muted">View:</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full px-2.5 py-1 text-xs ${
          selected === null ? "bg-coral text-sand" : "bg-surface-raised text-sand-muted hover:text-sand"
        }`}
      >
        All
      </button>
      {people.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={`rounded-full px-2.5 py-1 text-xs ${
            selected === name ? "bg-coral text-sand" : "bg-surface-raised text-sand-muted hover:text-sand"
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
