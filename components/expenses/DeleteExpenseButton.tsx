"use client";
// components/expenses/DeleteExpenseButton.tsx
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteExpenseButton({ expenseId }: { expenseId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Delete this expense? This cannot be undone.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?id=${expenseId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh(); // re-fetch server component data
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Failed to delete expense");
      }
    } catch {
      alert("Network error – please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:pointer-events-none"
      title="Delete expense"
      aria-label="Delete expense"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
