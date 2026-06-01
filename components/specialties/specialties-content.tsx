"use client";

import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SPECIALTY_PAGE_ITEMS } from "@/lib/constants/specialty-page";

const BRAND = "#1e7a82";

export function SpecialtiesContent() {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [filterOpen]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SPECIALTY_PAGE_ITEMS.filter((item) => {
      if (activeFilter && item.name !== activeFilter) return false;
      if (!normalized) return true;
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized)
      );
    });
  }, [query, activeFilter]);

  function selectFilter(name: string | null) {
    setActiveFilter(name);
    setFilterOpen(false);
  }

  return (
    <>
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.65rem]"
            style={{ color: BRAND }}
          >
            Find Doctors by Specialties
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Explore verified specialists across major medical fields and book the right doctor for
            your needs in minutes.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center">
          <label className="relative flex-1 sm:max-w-xl">
            <span className="sr-only">Search specialties</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search specialties..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base text-slate-800 shadow-sm outline-none transition focus:border-[#1e7a82] focus:ring-2 focus:ring-[#1e7a82]/20"
            />
          </label>
          <div className="relative sm:flex-shrink-0" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((open) => !open)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1e7a82]/40 hover:text-[#1e7a82] sm:w-auto"
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
            >
              <Filter className="h-4 w-4" aria-hidden />
              {activeFilter ? `Filter: ${activeFilter}` : "Filter"}
            </button>
            {filterOpen ? (
              <ul
                role="listbox"
                className="absolute right-0 z-20 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg sm:left-auto sm:right-0"
              >
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected={activeFilter === null}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => selectFilter(null)}
                  >
                    All specialties
                  </button>
                </li>
                {SPECIALTY_PAGE_ITEMS.map((item) => (
                  <li key={item.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeFilter === item.name}
                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                      onClick={() => selectFilter(item.name)}
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-slate-600">
            No specialties match your search. Try a different term or clear filters.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map(({ name, description, doctorCount, Icon }) => (
              <li key={name}>
                <article className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#1e7a82]/25 hover:shadow-md">
                  <span
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e7a82]/10 text-[#1e7a82] transition group-hover:bg-[#1e7a82]/15"
                    aria-hidden
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h2 className="text-lg font-bold" style={{ color: BRAND }}>
                    {name}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    {doctorCount} Doctors Available
                  </p>
                  <Link
                    href={`/doctors?specialty=${encodeURIComponent(name)}`}
                    className="mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-center text-sm font-bold text-white transition hover:opacity-90"
                    style={{ backgroundColor: BRAND }}
                  >
                    View Doctors
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div
          className="rounded-2xl px-6 py-10 text-center text-white sm:px-10 sm:py-12"
          style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #155a60 100%)` }}
        >
          <p className="mx-auto max-w-2xl text-lg font-semibold leading-snug sm:text-xl">
            Don&apos;t know which specialist to see? Consult our general physician.
          </p>
          <Link
            href="/doctors?specialty=General%20Medicine"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold transition hover:bg-slate-50"
            style={{ color: BRAND }}
          >
            Find a General Physician
          </Link>
        </div>
      </section>
    </>
  );
}
