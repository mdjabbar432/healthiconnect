import Link from "next/link";
import { ArrowLeft, ShieldCheck, Stethoscope } from "lucide-react";
import { DoctorLoginForm } from "@/components/doctor/doctor-login-form";
import { SiteFooter } from "@/components/home/site-footer";

export const metadata = {
  title: "Doctor Sign In | HealthiConnect",
  description:
    "Sign in to your HealthiConnect doctor dashboard to manage patients, reviews, and your profile.",
};

export default function DoctorLoginPage() {
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
              <Stethoscope className="h-8 w-8" aria-hidden />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-hc-brand">
              Doctor portal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Access your practice dashboard, manage patient relationships, and
              keep your professional profile up to date.
            </p>

            <ul className="mt-8 space-y-4 text-sm text-slate-700">
              <li className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-hc-brand"
                  aria-hidden
                />
                <span>Secure sign-in powered by Supabase Auth</span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-hc-brand"
                  aria-hidden
                />
                <span>
                  Profiles pending admin review see a clear status on your
                  dashboard
                </span>
              </li>
            </ul>
          </div>
        </aside>

        <div className="flex flex-1 flex-col justify-center lg:w-[58%]">
          <div className="mb-6 lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-wide text-hc-brand">
              Doctor portal
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Sign in to your dashboard
            </h2>
          </div>
          <DoctorLoginForm />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
