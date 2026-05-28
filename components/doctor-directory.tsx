"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Filter,
  Languages,
  MapPin,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { DIRECTORY_SPECIALTIES } from "@/lib/constants/specialties";

export type DoctorDirectoryItem = {
  id: string;
  slug: string;
  fullName: string;
  bio: string | null;
  credentials: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
  languages: string[];
  specialties: string[];
};

type DoctorDirectoryProps = {
  doctors: DoctorDirectoryItem[];
  initialSearch?: string;
  initialSpecialty?: string;
  initialLanguage?: string;
  initialLocation?: string;
};

const ALL_FILTER = "all";

function formatLocation(city: string | null, country: string | null): string {
  const parts = [city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location not listed";
}

function primarySpecialty(specialties: string[]): string {
  return specialties[0] ?? "General practice";
}

function buildLocationKey(city: string | null, country: string | null): string {
  return formatLocation(city, country);
}

function selectClassName(): string {
  return "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-hc-brand focus:bg-white focus:ring-2 focus:ring-hc-brand/20";
}

export function DoctorDirectory({
  doctors,
  initialSearch = "",
  initialSpecialty = "",
  initialLanguage = "",
  initialLocation = "",
}: DoctorDirectoryProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [specialtyFilter, setSpecialtyFilter] = useState(
    initialSpecialty || ALL_FILTER,
  );
  const [languageFilter, setLanguageFilter] = useState(
    initialLanguage || ALL_FILTER,
  );
  const [locationFilter, setLocationFilter] = useState(initialLocation);

  useEffect(() => {
    setQuery(initialSearch);
    setSpecialtyFilter(initialSpecialty || ALL_FILTER);
    setLanguageFilter(initialLanguage || ALL_FILTER);
    setLocationFilter(initialLocation);
  }, [initialSearch, initialSpecialty, initialLanguage, initialLocation]);

  function buildFiltersHref(next: {
    query?: string;
    specialty?: string;
    language?: string;
    location?: string;
  }): string {
    const params = new URLSearchParams();
    const searchValue = (next.query ?? query).trim();
    const specialtyValue = next.specialty ?? specialtyFilter;
    const languageValue = next.language ?? languageFilter;
    const locationValue = (next.location ?? locationFilter).trim();

    if (searchValue) params.set("search", searchValue);
    if (specialtyValue && specialtyValue !== ALL_FILTER) {
      params.set("specialty", specialtyValue);
    }
    if (languageValue && languageValue !== ALL_FILTER) {
      params.set("language", languageValue);
    }
    if (locationValue) params.set("location", locationValue);

    const qs = params.toString();
    return qs ? `/doctors?${qs}` : "/doctors";
  }

  const filterOptions = useMemo(() => {
    const specialtySet = new Set<string>(DIRECTORY_SPECIALTIES);
    const languageSet = new Set<string>();
    const locationSet = new Set<string>();

    for (const doctor of doctors) {
      for (const specialty of doctor.specialties) {
        if (specialty.trim()) specialtySet.add(specialty.trim());
      }
      for (const language of doctor.languages) {
        if (language.trim()) languageSet.add(language.trim());
      }
      const location = buildLocationKey(doctor.city, doctor.country);
      if (location !== "Location not listed") locationSet.add(location);
    }

    return {
      specialties: [...specialtySet].sort((a, b) => a.localeCompare(b)),
      languages: [...languageSet].sort((a, b) => a.localeCompare(b)),
      locations: [...locationSet].sort((a, b) => a.localeCompare(b)),
    };
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return doctors.filter((doctor) => {
      if (specialtyFilter !== ALL_FILTER) {
        const matchesSpecialty = doctor.specialties.some(
          (specialty) =>
            specialty.toLowerCase() === specialtyFilter.toLowerCase(),
        );
        if (!matchesSpecialty) return false;
      }

      if (languageFilter !== ALL_FILTER) {
        const matchesLanguage = doctor.languages.some(
          (language) =>
            language.toLowerCase() === languageFilter.toLowerCase(),
        );
        if (!matchesLanguage) return false;
      }

      if (locationFilter.trim().length > 0) {
        const location = buildLocationKey(doctor.city, doctor.country).toLowerCase();
        if (!location.includes(locationFilter.trim().toLowerCase())) return false;
      }

      if (!normalized) return true;

      const nameMatches = doctor.fullName.toLowerCase().includes(normalized);
      const specialtyMatches = doctor.specialties.some((specialty) =>
        specialty.toLowerCase().includes(normalized),
      );
      const bioMatches = doctor.bio?.toLowerCase().includes(normalized) ?? false;
      const credentialsMatches =
        doctor.credentials?.toLowerCase().includes(normalized) ?? false;
      const languageMatches = doctor.languages.some((language) =>
        language.toLowerCase().includes(normalized),
      );
      const locationMatches = formatLocation(doctor.city, doctor.country)
        .toLowerCase()
        .includes(normalized);

      return (
        nameMatches ||
        specialtyMatches ||
        bioMatches ||
        credentialsMatches ||
        languageMatches ||
        locationMatches
      );
    });
  }, [doctors, query, specialtyFilter, languageFilter, locationFilter]);

  const hasActiveFilters =
    specialtyFilter !== ALL_FILTER ||
    languageFilter !== ALL_FILTER ||
    locationFilter.trim().length > 0 ||
    query.trim().length > 0;

  function applySearch() {
    const href = buildFiltersHref({ query });
    router.push(href);
  }

  function clearFilters() {
    setQuery("");
    setSpecialtyFilter(ALL_FILTER);
    setLanguageFilter(ALL_FILTER);
    setLocationFilter("");
    router.push("/doctors");
  }

  const resultLabel =
    filteredDoctors.length === 1
      ? "1 specialist"
      : `${filteredDoctors.length} specialists`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <nav
          className="mb-6 flex items-center gap-2 text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded font-semibold text-hc-muted transition hover:text-hc-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Home
          </Link>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="font-medium text-slate-800">Find Doctors</span>
        </nav>

        <header className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[rgba(38,118,127,0.09)] px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hc-brand">
              Doctor directory
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-hc-brand sm:text-4xl">
              {initialSearch ? "Search results" : "Find your specialist"}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-hc-muted">
              {initialSearch ? (
                <>
                  Showing matches for{" "}
                  <span className="font-semibold text-slate-800">
                    &ldquo;{initialSearch}&rdquo;
                  </span>
                  . Browse verified clinicians on HealthiConnect.
                </>
              ) : (
                "Search by name and filter by specialty, language, or location to discover approved experts."
              )}
            </p>
          </div>

          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                applySearch();
              }}
            >
              <label htmlFor="directory-search" className="sr-only">
                Search doctors by name
              </label>
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  id="directory-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by doctor name..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-hc-brand focus:bg-white focus:ring-2 focus:ring-hc-brand/20"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-hc-brand px-6 py-3 text-[0.9375rem] font-bold text-white transition hover:bg-hc-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand"
              >
                <Search className="h-4 w-4" aria-hidden />
                Search
              </button>
            </form>

            <div
              className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4"
              aria-label="Filter doctors"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Filter className="h-4 w-4 text-hc-brand" aria-hidden />
                Filter results
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="directory-specialty-filter"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                    Specialty
                  </label>
                  <select
                    id="directory-specialty-filter"
                    value={specialtyFilter}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSpecialtyFilter(value);
                      router.replace(buildFiltersHref({ specialty: value }));
                    }}
                    className={selectClassName()}
                  >
                    <option value={ALL_FILTER}>All specialties</option>
                    {filterOptions.specialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="directory-language-filter"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    <Languages className="h-3.5 w-3.5" aria-hidden />
                    Language
                  </label>
                  <select
                    id="directory-language-filter"
                    value={languageFilter}
                    onChange={(event) => {
                      const value = event.target.value;
                      setLanguageFilter(value);
                      router.replace(buildFiltersHref({ language: value }));
                    }}
                    className={selectClassName()}
                    disabled={filterOptions.languages.length === 0}
                  >
                    <option value={ALL_FILTER}>
                      {filterOptions.languages.length === 0
                        ? "No languages listed"
                        : "All languages"}
                    </option>
                    {filterOptions.languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="directory-location-filter"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    Location
                  </label>
                  <input
                    id="directory-location-filter"
                    type="text"
                    value={locationFilter}
                    onChange={(event) => {
                      const value = event.target.value;
                      setLocationFilter(value);
                      router.replace(buildFiltersHref({ location: value }));
                    }}
                    className={selectClassName()}
                    placeholder="City or country"
                    autoComplete="off"
                  />
                </div>
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-hc-brand transition hover:text-hc-brand-hover"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Clear all filters
                </button>
              ) : null}
            </div>

            <p className="mt-3 text-sm text-hc-muted">
              {hasActiveFilters
                ? `${resultLabel} match your filters`
                : `${resultLabel} available`}
            </p>
          </div>
        </header>

        {filteredDoctors.length === 0 ? (
          <section
            className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm"
            aria-live="polite"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(38,118,127,0.1)]">
              <UserRound className="h-7 w-7 text-hc-brand" aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-slate-800">No doctors found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-hc-muted">
              {hasActiveFilters
                ? "Try adjusting your search or filters to see more specialists."
                : "No approved doctors are listed yet. Check back soon."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-hc-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-hc-brand-hover"
              >
                Clear filters
              </button>
            ) : null}
          </section>
        ) : (
          <section
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Doctor search results"
          >
            {filteredDoctors.map((doctor) => {
              const profileHref = `/doctors/${doctor.id}`;
              const location = formatLocation(doctor.city, doctor.country);
              const specialtyLabel = primarySpecialty(doctor.specialties);

              const cardContent = (
                <>
                  <div className="relative aspect-[4/3] bg-[#e8f4f5]">
                    {doctor.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doctor.photoUrl}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <Image
                        src="/assets/images/placeholder-doctor.svg"
                        alt=""
                        fill
                        unoptimized
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-hc-brand shadow-sm">
                      <Stethoscope className="h-3 w-3" aria-hidden />
                      Verified
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-bold leading-snug text-hc-brand transition group-hover:text-hc-brand-hover">
                      {doctor.fullName}
                    </h2>
                    <p className="mt-1 flex items-start gap-1.5 text-sm font-medium text-slate-700">
                      <Stethoscope
                        className="mt-0.5 h-4 w-4 shrink-0 text-hc-brand"
                        aria-hidden
                      />
                      <span>{specialtyLabel}</span>
                    </p>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-hc-muted">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-hc-brand"
                        aria-hidden
                      />
                      <span>{location}</span>
                    </p>

                    {doctor.credentials ? (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                        <Award
                          className="mt-0.5 h-4 w-4 shrink-0 text-hc-brand"
                          aria-hidden
                        />
                        <span className="line-clamp-1">{doctor.credentials}</span>
                      </p>
                    ) : null}

                    {doctor.specialties.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doctor.specialties.slice(0, 3).map((specialty) => (
                          <span
                            key={`${doctor.id}-${specialty}`}
                            className="rounded-full bg-[rgba(38,118,127,0.12)] px-2.5 py-0.5 text-xs font-bold text-hc-brand"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {doctor.bio ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-hc-muted">
                        {doctor.bio}
                      </p>
                    ) : null}

                    {doctor.languages.length > 0 ? (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="line-clamp-1">
                          {doctor.languages.slice(0, 3).join(" · ")}
                        </span>
                      </p>
                    ) : null}

                    <div className="mt-auto pt-5">
                      <span className="inline-flex w-full items-center justify-center rounded-[10px] bg-hc-brand py-2.5 text-sm font-bold text-white transition group-hover:bg-hc-brand-hover">
                        View profile
                      </span>
                    </div>
                  </div>
                </>
              );

              return (
                <Link
                  key={doctor.id}
                  href={profileHref}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand"
                >
                  {cardContent}
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
