"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, Mail, Stethoscope } from "lucide-react";
import { mapSignInErrorMessage } from "@/lib/auth/sign-in-error-messages";
import { fetchDoctorProfileForUser } from "@/lib/doctors/fetch-doctor-profile";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import { doctorLoginFormSchema } from "@/lib/validations/doctor-login";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

type FieldErrors = Partial<Record<"email" | "password" | "form", string>>;

export function DoctorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!isSupabaseClientConfigured()) {
      setCheckingSession(false);
      return;
    }

    let cancelled = false;

    async function redirectIfAlreadySignedIn() {
      const client = getSupabaseClient();
      if (!client) {
        setCheckingSession(false);
        return;
      }

      const { data } = await client.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId || cancelled) {
        setCheckingSession(false);
        return;
      }

      const { doctor } = await fetchDoctorProfileForUser(userId);
      if (cancelled) return;

      if (doctor) {
        router.replace("/doctor/dashboard");
        return;
      }

      setCheckingSession(false);
    }

    void redirectIfAlreadySignedIn();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = doctorLoginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key as keyof FieldErrors]) {
          next[key as keyof FieldErrors] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    if (!isSupabaseClientConfigured()) {
      setFieldErrors({
        form: "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const client = getSupabaseClient();
      if (!client) {
        setFieldErrors({
          form: "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        });
        setSubmitting(false);
        return;
      }

      const { data: authData, error: authError } =
        await client.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

      if (authError) {
        setFieldErrors({ form: mapSignInErrorMessage(authError.message) });
        setSubmitting(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setFieldErrors({
          form: "Sign in succeeded but no user was returned. Please try again.",
        });
        setSubmitting(false);
        return;
      }

      const { doctor, error: profileError } = await fetchDoctorProfileForUser(
        userId,
        { accessToken: authData.session?.access_token },
      );

      if (!doctor) {
        await client.auth.signOut();
        setFieldErrors({
          form: profileError
            ? "We could not load your doctor profile. Please try again later."
            : "No doctor profile found for this account. Please complete registration first.",
        });
        setSubmitting(false);
        return;
      }

      router.replace("/doctor/dashboard");
    } catch {
      setFieldErrors({
        form: "Something went wrong. Check your connection and try again.",
      });
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <div
        className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        aria-busy="true"
        aria-label="Checking session"
      >
        <Loader2 className="h-8 w-8 animate-spin text-hc-brand" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      noValidate
    >
      {fieldErrors.form ? (
        <div
          role="alert"
          className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{fieldErrors.form}</span>
        </div>
      ) : null}

      <div className="space-y-5">
        <div>
          <label
            htmlFor="doctor-login-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="doctor-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder="you@clinic.com"
              disabled={submitting}
            />
          </div>
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="doctor-login-password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="doctor-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder="Your password"
              disabled={submitting}
            />
          </div>
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[10px] bg-hc-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-hc-brand-hover disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          <>
            <Stethoscope className="h-4 w-4" aria-hidden />
            Sign in to dashboard
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-slate-500">
        New to HealthiConnect?{" "}
        <Link
          href="/doctor/register"
          className="font-medium text-hc-brand hover:underline"
        >
          Apply as a doctor
        </Link>
      </p>
    </form>
  );
}
