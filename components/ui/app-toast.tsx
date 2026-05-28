"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export type AppToastProps = {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
};

export function AppToast({
  message,
  onDismiss,
  durationMs = 4000,
}: AppToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
      <p className="flex-1 text-sm font-medium text-slate-800">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded p-0.5 text-slate-400 transition hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
