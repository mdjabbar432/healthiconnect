import { PartnersDirectory } from "@/components/partners-directory";
import { SiteFooter } from "@/components/home";
import { fetchDirectoryPartners } from "@/lib/partners/fetch-directory-partners";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const { partners, error } = await fetchDirectoryPartners();

  if (error) {
    return (
      <>
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-16 pt-6 sm:pt-10">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center">
              <h1 className="text-2xl font-bold text-red-800">
                Unable to load partners
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
      <PartnersDirectory partners={partners} />
      <SiteFooter />
    </>
  );
}
