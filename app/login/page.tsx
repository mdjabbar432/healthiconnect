import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PortalLoginForm } from "@/components/auth/portal-login-form";
import { SiteFooter } from "@/components/home/site-footer";

export const metadata = {
  title: "Sign In | HealthiConnect",
  description: "Sign in to access your HealthiConnect portal.",
};

type PageProps = {
  searchParams?: Promise<{ redirect?: string | string[] }>;
};

async function resolveRedirect(
  searchParams: PageProps["searchParams"],
): Promise<string | undefined> {
  const resolved = searchParams ? await searchParams : undefined;
  const raw = resolved?.redirect;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) {
    return raw[0].trim();
  }
  return undefined;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const redirectTo = await resolveRedirect(searchParams);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:flex-row lg:items-stretch lg:gap-10 lg:py-14">
        <aside className="mb-8 flex flex-col justify-center lg:mb-0 lg:w-[42%] lg:pr-4">
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-hc-brand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>

          <div className="rounded-2xl border border-slate-200/80 bg-[rgba(38,118,127,0.06)] p-8 shadow-sm lg:p-10">
            <div className="inline-flex rounded-xl bg-hc-brand/10 p-3 text-hc-brand">
              <ShieldCheck className="h-8 w-8" aria-hidden />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-hc-brand">
              Staff portal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Sign in to continue
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Use your authorized HealthiConnect email to access admin, doctor,
              or agent areas.
            </p>
          </div>
        </aside>

        <div className="flex flex-1 flex-col justify-center lg:w-[58%]">
          <div className="mb-6 lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-wide text-hc-brand">
              Staff portal
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Sign in</h2>
          </div>
          <PortalLoginForm redirectTo={redirectTo} />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
