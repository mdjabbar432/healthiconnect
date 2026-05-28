import { DoctorDirectory } from "@/components/doctor-directory";
import { SiteFooter } from "@/components/home";
import { fetchDirectoryDoctors } from "@/lib/doctors/fetch-directory-doctors";
import { mapDirectoryRowsToItems } from "@/lib/doctors/map-directory-doctor";

export const dynamic = "force-dynamic";

type DoctorsFilterParams = {
  search?: string | string[];
  specialty?: string | string[];
  language?: string | string[];
  location?: string | string[];
};

type PageProps = {
  searchParams?: Promise<DoctorsFilterParams>;
};

async function resolveParam(
  searchParams: PageProps["searchParams"],
  key: keyof DoctorsFilterParams,
): Promise<string> {
  const resolved = searchParams ? await searchParams : undefined;
  const raw = resolved?.[key];
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0].trim();
  return "";
}

export default async function DoctorsPage({ searchParams }: PageProps) {
  const [search, specialty, language, location] = await Promise.all([
    resolveParam(searchParams, "search"),
    resolveParam(searchParams, "specialty"),
    resolveParam(searchParams, "language"),
    resolveParam(searchParams, "location"),
  ]);
  const { doctors: rows, error } = await fetchDirectoryDoctors({
    search: search || undefined,
    specialty: specialty || undefined,
    language: language || undefined,
    location: location || undefined,
  });

  if (error) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16 pt-6 sm:pt-10">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <h1 className="text-2xl font-bold text-red-800">
                Unable to load doctors
              </h1>
              <p className="mt-2 text-sm text-red-700">
                Please try again in a few moments.
              </p>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  let doctors;
  try {
    doctors = mapDirectoryRowsToItems(rows);
  } catch (cause) {
    console.error("[DoctorsPage] Failed to map directory rows:", cause);
    return (
      <>
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16 pt-6 sm:pt-10">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <h1 className="text-2xl font-bold text-red-800">
                Unable to load doctors
              </h1>
              <p className="mt-2 text-sm text-red-700">
                Please try again in a few moments.
              </p>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <DoctorDirectory
        doctors={doctors}
        initialSearch={search}
        initialSpecialty={specialty}
        initialLanguage={language}
        initialLocation={location}
      />
      <SiteFooter />
    </>
  );
}
