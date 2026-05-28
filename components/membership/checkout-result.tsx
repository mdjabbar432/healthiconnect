import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type CheckoutResultProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  variant: "success" | "cancel";
  sessionId?: string;
};

export function CheckoutResult({
  icon: Icon,
  title,
  description,
  variant,
  sessionId,
}: CheckoutResultProps) {
  const isSuccess = variant === "success";

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? "bg-[rgba(38,118,127,0.12)]" : "bg-slate-100"
          }`}
        >
          <Icon
            className={`h-8 w-8 ${isSuccess ? "text-hc-brand" : "text-slate-500"}`}
            aria-hidden
          />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-hc-muted">{description}</p>
        {sessionId ? (
          <p className="mt-4 break-all text-xs text-slate-400">
            Reference: <span className="font-mono">{sessionId}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isSuccess ? (
            <Link
              href="/patient/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-hc-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-hc-brand-hover"
            >
              Open dashboard
            </Link>
          ) : (
            <Link
              href="/membership"
              className="inline-flex items-center justify-center rounded-xl bg-hc-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-hc-brand-hover"
            >
              View plans again
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
