"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-sm text-slate-600">
        The page could not load. This often happens when the dev cache is stale — try
        restarting with <code className="rounded bg-slate-100 px-1">npm run dev:clean</code>.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-hc-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-hc-brand-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
