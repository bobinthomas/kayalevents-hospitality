"use client";

import { useState } from "react";

export function PdfExportButton({ artistFormId }: { artistFormId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/${artistFormId}/pdf`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={loading}
        className="rounded bg-coral px-3 py-1.5 text-sm text-sand hover:bg-coral-bright disabled:opacity-50"
      >
        {loading ? "Exporting…" : "Export PDF"}
      </button>
      {error && <span className="text-sm text-coral-bright">{error}</span>}
    </div>
  );
}
