"use client";

import { useState } from "react";
import Link from "next/link";
import { DoctorRegistrationForm } from "@/components/doctor-registration-form";

export function DoctorRegisterPageContent() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      {!submitted ? (
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-hc-brand">
            For healthcare professionals
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Join as a doctor
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Create your account and submit your credentials. After admin approval,
            your profile will appear in our public directory.
          </p>
        </div>
      ) : null}

      <DoctorRegistrationForm onSuccess={() => setSubmitted(true)} />

      {!submitted ? (
        <p className="mt-6 text-center text-sm text-slate-500">
          Looking for care?{" "}
          <Link
            href="/doctors"
            className="font-medium text-hc-brand hover:underline"
          >
            Find a doctor
          </Link>
        </p>
      ) : null}
    </div>
  );
}
