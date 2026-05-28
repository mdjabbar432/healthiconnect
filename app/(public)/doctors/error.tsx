"use client";

import Link from "next/link";

export default function DoctorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16 pt-6 sm:pt-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-800">Unable to load doctors</h1>
          <p className="mt-2 text-sm text-red-700">
            {error.message || "Something went wrong while loading the directory."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-[10px] bg-hc-brand px-4 py-2 text-sm font-semibold text-white hover:bg-hc-brand-hover"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
