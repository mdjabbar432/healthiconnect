import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FlaskConical,
  MapPin,
  Pill,
  Scan,
} from "lucide-react";
import { SiteFooter } from "@/components/home";
import { PartnerReviewsSection } from "@/components/partner/partner-reviews-section";
import {
  fetchActivePartnerById,
  parsePartnerRouteId,
} from "@/lib/partners/fetch-public-partner-profile";
import { PARTNER_TYPE_LABELS } from "@/lib/partners/partner-type-labels";
import {
  averageReviewRating,
  fetchVisiblePartnerReviews,
} from "@/lib/reviews/fetch-partner-reviews";
import type { PartnerType } from "@/types/domain";

type PartnerRouteParams = { id: string };

type PageProps = {
  params: Promise<PartnerRouteParams>;
};

export const dynamic = "force-dynamic";

function partnerTypeIcon(type: PartnerType) {
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

function formatLocation(
  address: string | null,
  city: string | null,
  country: string | null,
): string | null {
  if (address?.trim()) return address.trim();

  const parts = [city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await params;
  const partnerId = parsePartnerRouteId(p.id);
  if (!partnerId) return { title: "Partner | HealthiConnect" };

  const partner = await fetchActivePartnerById(partnerId);
  if (!partner) return { title: "Partner | HealthiConnect" };

  const typeLabel = PARTNER_TYPE_LABELS[partner.type];

  return {
    title: `${partner.name} | HealthiConnect`,
    description: `${partner.name} — ${typeLabel}. View partner details and patient reviews on HealthiConnect.`,
  };
}

export default async function PartnerProfilePage({ params }: PageProps) {
  const p = await params;
  const partnerId = parsePartnerRouteId(p.id);

  if (!partnerId) notFound();

  const partner = await fetchActivePartnerById(partnerId);
  if (!partner) notFound();

  const { reviews } = await fetchVisiblePartnerReviews(partner.id);
  const averageRating = averageReviewRating(reviews);

  const TypeIcon = partnerTypeIcon(partner.type);
  const typeLabel = PARTNER_TYPE_LABELS[partner.type];
  const location = formatLocation(partner.address, partner.city, partner.country);

  const memberSince = new Date(partner.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16 pt-6 sm:pt-10">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <nav
            className="mb-6 flex items-center gap-2 text-sm"
            aria-label="Breadcrumb"
          >
            <Link
              href="/partners"
              className="inline-flex items-center gap-1 rounded font-semibold text-hc-muted transition hover:text-hc-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Partner Directory
            </Link>
            <span className="text-slate-300" aria-hidden>
              /
            </span>
            <span className="truncate font-medium text-slate-800">
              {partner.name}
            </span>
          </nav>

          <div className="mx-auto max-w-4xl space-y-8">
            <section
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              aria-labelledby="partner-profile-heading"
            >
              <div className="bg-[rgba(38,118,127,0.09)] px-6 py-6 sm:px-8">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hc-brand">
                  Partner profile
                </p>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-white shadow-md ring-4 ring-[rgba(38,118,127,0.12)]">
                    <TypeIcon
                      className="h-10 w-10 text-hc-brand"
                      aria-hidden
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1
                      id="partner-profile-heading"
                      className="text-3xl font-bold tracking-tight text-hc-brand sm:text-4xl"
                    >
                      {partner.name}
                    </h1>

                    <p className="mt-2 inline-flex items-center gap-1.5 text-base font-semibold text-slate-800">
                      <TypeIcon
                        className="h-5 w-5 shrink-0 text-hc-brand"
                        aria-hidden
                      />
                      {typeLabel}
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-[rgba(38,118,127,0.12)] px-3 py-1 text-xs font-bold text-hc-brand">
                      HealthiConnect partner
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-slate-100 px-6 py-4 text-sm text-hc-muted sm:px-8 sm:justify-start">
                {location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-hc-brand" aria-hidden />
                    <span>{location}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <MapPin className="h-4 w-4" aria-hidden />
                    Address not listed
                  </span>
                )}
                <span className="text-slate-300 max-sm:hidden" aria-hidden>
                  |
                </span>
                <span>Listed since {memberSince}</span>
              </div>
            </section>

            <section
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              aria-labelledby="partner-services-heading"
            >
              <h2
                id="partner-services-heading"
                className="text-xl font-bold text-hc-brand"
              >
                Services
              </h2>
              {partner.services.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {partner.services.map((service) => (
                    <li
                      key={service}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-hc-muted">
                  Services for this partner have not been listed yet.
                </p>
              )}
            </section>

            <PartnerReviewsSection
              partnerId={partner.id}
              partnerName={partner.name}
              initialReviews={reviews}
              initialAverageRating={averageRating}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
