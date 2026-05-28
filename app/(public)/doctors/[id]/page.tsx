import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { DoctorReviewsSection } from "@/components/doctor/doctor-reviews-section";
import {
  fetchApprovedPublicDoctor,
  publicDoctorSpecialties,
  resolvePublicDoctorFullName,
} from "@/lib/doctors/fetch-public-doctor-profile";
import {
  averageReviewRating,
  fetchVisibleDoctorReviews,
} from "@/lib/reviews/fetch-doctor-reviews";
import { safeDecodePathSegment } from "@/lib/slugify";

type DoctorRouteParams = { id: string };

type PageProps = {
  params: Promise<DoctorRouteParams>;
};

function normalizeRouteParam(raw: unknown): string | undefined {
  let segment: string | undefined;
  if (typeof raw === "string") segment = raw;
  else if (Array.isArray(raw) && typeof raw[0] === "string") segment = raw[0];
  else return undefined;

  const decoded = safeDecodePathSegment(segment);
  return decoded.length > 0 ? decoded : undefined;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const p = await params;
  const routeId = normalizeRouteParam(p.id);
  if (!routeId) return { title: "Doctor | HealthiConnect" };

  const doctor = await fetchApprovedPublicDoctor(routeId);
  if (!doctor) return { title: "Doctor | HealthiConnect" };

  const name = resolvePublicDoctorFullName(doctor.profiles);
  const primarySpecialty =
    publicDoctorSpecialties(doctor)[0] ?? "Verified specialist";

  return {
    title: `${name} | HealthiConnect`,
    description:
      doctor.bio?.slice(0, 160) ??
      `${name}, ${primarySpecialty}. View profile and patient reviews on HealthiConnect.`,
  };
}

export default async function DoctorProfilePage({ params }: PageProps) {
  const p = await params;
  const routeId = normalizeRouteParam(p.id);

  if (!routeId) notFound();

  const doctor = await fetchApprovedPublicDoctor(routeId);
  if (!doctor) notFound();

  const { reviews } = await fetchVisibleDoctorReviews(doctor.id);
  const averageRating = averageReviewRating(reviews);

  const displayName = resolvePublicDoctorFullName(doctor.profiles);
  const specialties = publicDoctorSpecialties(doctor);
  const primarySpecialtyLabel =
    specialties.length > 0 ? specialties.join(" · ") : "General practice";

  const location =
    doctor.city || doctor.country
      ? [doctor.city, doctor.country].filter(Boolean).join(", ")
      : null;

  const memberSince = new Date(doctor.created_at).toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    },
  );

  const languages =
    doctor.languages?.filter((lang) => lang.trim().length > 0) ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16 pt-6 sm:pt-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <nav
          className="mb-6 flex items-center gap-2 text-sm"
          aria-label="Breadcrumb"
        >
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1 rounded font-semibold text-hc-muted transition hover:text-hc-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Find Doctors
          </Link>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="truncate font-medium text-slate-800">
            {displayName}
          </span>
        </nav>

        <div className="mx-auto max-w-4xl space-y-8">
          <section
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            aria-labelledby="doctor-profile-heading"
          >
            <div className="bg-[rgba(38,118,127,0.09)] px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hc-brand">
                Doctor profile
              </p>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-md ring-4 ring-[rgba(38,118,127,0.12)] lg:mx-0">
                  {doctor.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doctor.photo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/assets/images/placeholder-doctor.svg"
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-center lg:text-left">
                  <h1
                    id="doctor-profile-heading"
                    className="text-3xl font-bold tracking-tight text-hc-brand sm:text-4xl"
                  >
                    {displayName}
                  </h1>

                  <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-base font-semibold text-slate-800 lg:justify-start">
                    <Stethoscope
                      className="h-5 w-5 shrink-0 text-hc-brand"
                      aria-hidden
                    />
                    {primarySpecialtyLabel}
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
                    {specialties.length > 0 ? (
                      specialties.map((specialty) => (
                        <span
                          key={`${doctor.id}-${specialty}`}
                          className="rounded-full bg-[rgba(38,118,127,0.12)] px-3 py-1 text-xs font-bold text-hc-brand"
                        >
                          {specialty}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Specialist
                      </span>
                    )}
                  </div>

                  {doctor.bio ? (
                    <p className="mt-4 text-base leading-relaxed text-slate-700">
                      {doctor.bio}
                    </p>
                  ) : null}

                  {doctor.license_number ? (
                    <p className="mt-4 text-sm text-slate-600">
                      <span className="font-bold uppercase tracking-wide text-slate-500">
                        License:
                      </span>{" "}
                      <span className="font-mono text-slate-800">
                        {doctor.license_number}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-slate-100 px-6 py-4 text-sm text-hc-muted sm:px-8 lg:justify-start">
              {location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-hc-brand" aria-hidden />
                  <span>{location}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <MapPin className="h-4 w-4" aria-hidden />
                  Location not listed
                </span>
              )}
              <span className="text-slate-300 max-sm:hidden" aria-hidden>
                |
              </span>
              <span>On HealthiConnect since {memberSince}</span>
            </div>
          </section>

          {(doctor.credentials || languages.length > 0) && (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              aria-labelledby="credentials-heading"
            >
              <div className="mb-5 flex items-center gap-2">
                <Award className="h-6 w-6 text-hc-brand" aria-hidden />
                <h2
                  id="credentials-heading"
                  className="text-xl font-bold text-hc-brand"
                >
                  Credentials & details
                </h2>
              </div>

              <div className="space-y-6">
                {doctor.credentials ? (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Professional credentials
                    </h3>
                    <p className="mt-2 text-[1.05rem] leading-relaxed text-slate-700">
                      {doctor.credentials}
                    </p>
                  </div>
                ) : null}

                {languages.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                      Languages
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {languages.map((lang) => (
                        <li
                          key={lang}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700"
                        >
                          {lang}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          )}

          <DoctorReviewsSection
            doctorId={doctor.id}
            doctorName={displayName}
            initialReviews={reviews}
            initialAverageRating={averageRating}
          />
        </div>
      </div>
    </main>
  );
}
