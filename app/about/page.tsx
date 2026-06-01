import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  Headset,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { StatsBar, SiteFooter } from "@/components/home";

const BRAND = "#1e7a82";

const CORE_VALUES = [
  {
    title: "Verified Doctors",
    description:
      "Every clinician completes profile verification so you can book with confidence.",
    Icon: UserCheck,
  },
  {
    title: "24/7 Support",
    description:
      "Continuous emergency and care navigation support whenever you need guidance.",
    Icon: Headset,
  },
  {
    title: "Secure Data",
    description:
      "Patient records are protected with Supabase-backed security and access controls.",
    Icon: ShieldCheck,
  },
  {
    title: "Easy Booking",
    description:
      "Search, compare, and schedule appointments in a few clear, hassle-free steps.",
    Icon: CalendarCheck,
  },
] as const;

export const metadata: Metadata = {
  title: "About Us | HealthiConnect",
  description:
    "Learn how HealthiConnect bridges patients and quality healthcare with verified doctors, secure data, and seamless booking.",
};

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <section className="relative min-h-[320px] overflow-hidden sm:min-h-[420px]">
          <Image
            src="/assets/images/healthi-connect-banner.webp"
            alt="HealthiConnect care team collaborating with patients"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-slate-900/45" aria-hidden />
          <div className="relative mx-auto flex min-h-[320px] max-w-6xl items-center px-4 py-16 sm:min-h-[420px] sm:px-6 sm:py-20">
            <div className="max-w-xl rounded-2xl bg-white/95 px-6 py-8 shadow-lg backdrop-blur-sm sm:px-8 sm:py-10">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: BRAND }}
              >
                About HealthiConnect
              </p>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Bridging the Gap Between You and Your Healthcare
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                We connect patients with verified specialists, transparent care options, and
                technology that makes healthcare feel human again.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: BRAND }}>
              Our Mission
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              To make quality healthcare accessible for everyone—regardless of location or
              schedule—by simplifying how patients discover, compare, and book trusted medical
              professionals.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: BRAND }}>
              Our Vision
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              A technology-driven healthcare ecosystem where secure data, smart matching, and
              compassionate support help every patient receive the right care at the right time.
            </p>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/60 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: BRAND }}>
                Our Core Values
              </h2>
              <p className="mt-3 text-slate-600">
                Principles that guide every product decision and patient experience on our platform.
              </p>
            </div>
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {CORE_VALUES.map(({ title, description, Icon }) => (
                <li
                  key={title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e7a82]/10 text-[#1e7a82]"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <StatsBar />

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div
            className="rounded-2xl px-6 py-10 text-center sm:px-10 sm:py-12"
            style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #155a60 100%)` }}
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Experience Better Healthcare?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">
              Whether you need a specialist or want to grow your practice with us, we&apos;re here
              to help.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/doctors"
                className="inline-flex min-w-[10rem] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold transition hover:bg-slate-50"
                style={{ color: BRAND }}
              >
                Find a Doctor
              </Link>
              <Link
                href="/doctor/register"
                className="inline-flex min-w-[10rem] items-center justify-center rounded-lg border-2 border-white px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Join as a Partner
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
