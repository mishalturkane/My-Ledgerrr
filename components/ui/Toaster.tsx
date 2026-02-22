"use client";
// components/ui/Toaster.tsx
import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { removeToast, type Toast } from "@/store/slices/uiSlice";

/** Container rendered at the root – shows stacked toast notifications. */
export function Toaster() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((s) => s.ui.toasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dispatch(removeToast(toast.id))}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  // Auto-dismiss after 4 s
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const Icon = {
    success: <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />,
    error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
    info: <Info size={18} className="text-brand-500 flex-shrink-0" />,
  }[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-start gap-3 bg-white dark:bg-slate-800 border shadow-lg rounded-2xl p-4 animate-slide-in-right",
        toast.type === "success" && "border-emerald-200 dark:border-emerald-800",
        toast.type === "error"   && "border-red-200 dark:border-red-800",
        toast.type === "info"    && "border-brand-200 dark:border-brand-800"
      )}
    >
      {Icon}
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
