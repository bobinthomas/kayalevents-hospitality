import type { MealMatrix as MealMatrixData } from "@/lib/plan-view-model";

/** Rows = meal/refreshment slots, columns = roster, cells = selection. Special-requirements notes are never rendered in a cell — they're pulled out into the flagged strip in day-section.tsx. */
export function MealsMatrix({ matrix, title }: { matrix: MealMatrixData; title: string }) {
  if (matrix.slots.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-sand-muted">{title}</h3>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "160px" }} />
            {matrix.people.map((p) => (
              <col key={p.artistName} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-surface-raised text-left text-xs text-sand-muted">
              <th className="px-3 py-2 font-medium">Meal</th>
              {matrix.people.map((p) => (
                <th key={p.artistName} className="truncate px-3 py-2 font-medium">
                  {p.artistName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.slots.map((slot) => (
              <tr key={slot} className="border-t border-border-soft">
                <td className="px-3 py-2 font-medium text-sand">{slot}</td>
                {matrix.people.map((p) => {
                  const selection = matrix.cells[slot]?.[p.artistName] ?? null;
                  return (
                    <td key={p.artistName} className="truncate px-3 py-2 text-sand-muted">
                      {selection ?? <span className="text-border">·</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
