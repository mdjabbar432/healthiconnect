"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  HeartPulse,
  Loader2,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { mapSignInErrorMessage } from "@/lib/auth/sign-in-error-messages";
import { fetchPatientSessionForUser } from "@/lib/patients/fetch-patient-session";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import {
  patientSignInSchema,
  patientSignUpSchema,
} from "@/lib/validations/patient-auth";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

type AuthMode = "sign-in" | "sign-up";

type FieldErrors = Partial<
  Record<"fullName" | "email" | "password" | "form", string>
>;

export type PatientAuthFormProps = {
  mode: AuthMode;
  redirectTo?: string;
};

export function PatientAuthForm({ mode, redirectTo }: PatientAuthFormProps) {
  const router = useRouter();
  const destination = sanitizeRedirectPath(redirectTo);

  const [fullName, setFullName] = useState("");
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

      const session = await fetchPatientSessionForUser(userId);
      if (cancelled) return;

      if (session) {
        router.replace(destination);
        return;
      }

      setCheckingSession(false);
    }

    void redirectIfAlreadySignedIn();

    return () => {
      cancelled = true;
    };
  }, [router, destination]);

  async function establishSessionAfterRegister(
    client: NonNullable<ReturnType<typeof getSupabaseClient>>,
    emailValue: string,
    passwordValue: string,
  ): Promise<string | null> {
    const { data: authData, error: authError } =
      await client.auth.signInWithPassword({
        email: emailValue,
        password: passwordValue,
      });

    if (authError) {
      return mapSignInErrorMessage(authError.message);
    }

    const userId = authData.user?.id;
    if (!userId) {
      return "Account created but sign-in failed. Please sign in manually.";
    }

    const session = await fetchPatientSessionForUser(userId);
    if (!session) {
      await client.auth.signOut();
      return "Patient profile could not be loaded. Please contact support.";
    }

    return null;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = patientSignInSchema.safeParse({ email, password });
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
        setFieldErrors({ form: "Authentication is not configured." });
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

      const session = await fetchPatientSessionForUser(userId);
      if (!session) {
        await client.auth.signOut();
        setFieldErrors({
          form: "No patient profile found for this account. Please create a patient account first.",
        });
        setSubmitting(false);
        return;
      }

      router.replace(destination);
    } catch {
      setFieldErrors({
        form: "Something went wrong. Check your connection and try again.",
      });
      setSubmitting(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const parsed = patientSignUpSchema.safeParse({
      fullName,
      email,
      password,
    });

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
      const res = await fetch("/api/patients/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const payload = (await res.json()) as {
        error?: string;
        details?: unknown;
        code?: string;
      };

      if (!res.ok) {
        const detailText =
          typeof payload.details === "string"
            ? payload.details
            : payload.code === "user_exists"
              ? "Sign in with that email instead."
              : undefined;

        setFieldErrors({
          form: detailText
            ? `${payload.error ?? "Registration failed"}: ${detailText}`
            : (payload.error ?? "Registration failed. Please try again."),
        });
        setSubmitting(false);
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setFieldErrors({
          form: "Account created. Please sign in with your email and password.",
        });
        setSubmitting(false);
        return;
      }

      const sessionError = await establishSessionAfterRegister(
        client,
        parsed.data.email,
        parsed.data.password,
      );

      if (sessionError) {
        setFieldErrors({ form: sessionError });
        setSubmitting(false);
        return;
      }

      router.replace(destination);
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

  const isSignUp = mode === "sign-up";

  return (
    <form
      onSubmit={isSignUp ? handleSignUp : handleSignIn}
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
        {isSignUp ? (
          <div>
            <label
              htmlFor="patient-full-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="patient-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClassName} pl-10`}
                placeholder="Your name"
                disabled={submitting}
              />
            </div>
            {fieldErrors.fullName ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="patient-email"
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
              id="patient-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder="you@example.com"
              disabled={submitting}
            />
          </div>
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="patient-password"
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
              id="patient-password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder={isSignUp ? "At least 8 characters" : "Your password"}
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
            {isSignUp ? "Creating account…" : "Signing in…"}
          </>
        ) : (
          <>
            <HeartPulse className="h-4 w-4" aria-hidden />
            {isSignUp ? "Create patient account" : "Sign in"}
          </>
        )}
      </button>

      <p className="mt-4 text-center text-xs text-slate-500">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href={
                redirectTo
                  ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}`
                  : "/sign-in"
              }
              className="font-medium text-hc-brand hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to HealthiConnect?{" "}
            <Link
              href={
                redirectTo
                  ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}`
                  : "/sign-up"
              }
              className="font-medium text-hc-brand hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </p>

      <p className="mt-3 text-center text-xs text-slate-400">
        Are you a doctor?{" "}
        <Link href="/doctor/login" className="text-hc-brand hover:underline">
          Doctor sign in
        </Link>
      </p>
    </form>
  );
}
