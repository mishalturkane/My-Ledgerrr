"use client";
// components/projects/ExportButton.tsx
import { useState } from "react";
import { Download, ChevronDown, Loader2 } from "lucide-react";

type ExportType = "weekly" | "monthly" | "yearly";

export function ExportButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const exportPDF = async (type: ExportType) => {
    setLoading(true);
    setOpen(false);
    try {
      const date = new Date().toISOString();
      const url = `/api/export?projectId=${projectId}&type=${type}&date=${encodeURIComponent(date)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Export failed");
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `ledger_${type}_export.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="btn-secondary"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
        Export PDF
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <>
          {/* Click-outside overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Dropdown */}
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden w-40"
          >
            {(["weekly", "monthly", "yearly"] as ExportType[]).map((type) => (
              <button
                key={type}
                role="menuitem"
                onClick={() => exportPDF(type)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 capitalize transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
