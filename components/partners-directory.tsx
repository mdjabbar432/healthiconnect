"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  FlaskConical,
  MapPin,
  Pill,
  Scan,
  Search,
} from "lucide-react";
import type { PartnerDirectoryItem } from "@/lib/partners/fetch-directory-partners";
import { PARTNER_TYPE_LABELS } from "@/lib/partners/partner-type-labels";
import type { PartnerType } from "@/types/domain";

type PartnersDirectoryProps = {
  partners: PartnerDirectoryItem[];
};

function typeIcon(type: PartnerType) {
  switch (type) {
    case "lab":
      return FlaskConical;
    case "pharmacy":
      return Pill;
    case "radiology":
      return Scan;
    default:
      return Building2;
  }
}

function formatServices(services: string[]): string {
  if (services.length === 0) return "Services not listed";
  return services.join(", ");
}

export function PartnersDirectory({ partners }: PartnersDirectoryProps) {
  const [query, setQuery] = useState("");

  const filteredPartners = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return partners;

    return partners.filter((partner) => {
      const nameMatches = partner.name.toLowerCase().includes(normalized);
      const typeMatches = TYPE_LABELS[partner.type]
        .toLowerCase()
        .includes(normalized);
      const addressMatches =
        partner.address?.toLowerCase().includes(normalized) ?? false;
      const servicesMatches = partner.services.some((service) =>
        service.toLowerCase().includes(normalized),
      );

      return nameMatches || typeMatches || addressMatches || servicesMatches;
    });
  }, [partners, query]);

  const resultLabel =
    filteredPartners.length === 1
      ? "1 partner"
      : `${filteredPartners.length} partners`;

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
          <span className="font-medium text-slate-800">Partner Directory</span>
        </nav>

        <header className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[rgba(38,118,127,0.09)] px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hc-brand">
              Partner directory
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-hc-brand sm:text-4xl">
              Labs, pharmacies &amp; radiology
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-hc-muted">
              Browse HealthiConnect partner locations with services and addresses
              for member discounts and referrals.
            </p>
          </div>

          <div className="border-t border-slate-100 px-6 py-5 sm:px-8">
            <label htmlFor="partner-directory-search" className="sr-only">
              Search partners
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="partner-directory-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, type, address, or service..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-hc-brand focus:bg-white focus:ring-2 focus:ring-hc-brand/20"
                autoComplete="off"
              />
            </div>
            <p className="mt-3 text-sm text-hc-muted">{resultLabel} listed</p>
          </div>
        </header>

        {filteredPartners.length === 0 ? (
          <section
            className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm"
            aria-live="polite"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(38,118,127,0.1)]">
              <Building2 className="h-7 w-7 text-hc-brand" aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-slate-800">No partners found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-hc-muted">
              {query.trim()
                ? "Try a different search term to find labs, pharmacies, or radiology centers."
                : "No active partners are listed yet. Check back soon."}
            </p>
          </section>
        ) : (
          <section
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Partner directory results"
          >
            {filteredPartners.map((partner) => {
              const Icon = typeIcon(partner.type);
              const profileHref = `/partners/${partner.id}`;

              return (
                <Link
                  key={partner.id}
                  href={profileHref}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold leading-snug text-hc-brand transition group-hover:text-hc-brand-hover">
                      {partner.name}
                    </h2>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(38,118,127,0.12)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-hc-brand">
                      <Icon className="h-3 w-3" aria-hidden />
                      {PARTNER_TYPE_LABELS[partner.type]}
                    </span>
                  </div>

                  {partner.address ? (
                    <p className="mt-3 flex items-start gap-1.5 text-sm text-hc-muted">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-hc-brand"
                        aria-hidden
                      />
                      <span>{partner.address}</span>
                    </p>
                  ) : null}

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {formatServices(partner.services)}
                  </p>

                  <span className="mt-5 inline-flex w-full items-center justify-center rounded-[10px] bg-hc-brand py-2.5 text-sm font-bold text-white transition group-hover:bg-hc-brand-hover">
                    View details
                  </span>
                </Link>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
