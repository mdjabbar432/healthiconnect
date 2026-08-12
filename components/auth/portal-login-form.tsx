"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { isEmailAllowedForPath } from "@/lib/auth/route-access";
import { mapSignInErrorMessage } from "@/lib/auth/sign-in-error-messages";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import { doctorLoginFormSchema } from "@/lib/validations/doctor-login";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

type FieldErrors = Partial<Record<"email" | "password" | "form", string>>;

export type PortalLoginFormProps = {
  redirectTo?: string;
};

export function PortalLoginForm({ redirectTo }: PortalLoginFormProps) {
  const router = useRouter();
  const destination = sanitizeRedirectPath(redirectTo, "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseClientConfigured()) return;

    let cancelled = false;

    async function reconcileSession() {
      const client = getSupabaseClient();
      if (!client || cancelled) return;

      const { data } = await client.auth.getSession();
      const userEmail = data.session?.user?.email;
      if (!userEmail || cancelled) return;

      if (isEmailAllowedForPath(userEmail, destination)) {
        router.replace(destination);
        return;
      }

      // Stale or wrong-role session (middleware sent us here). Clear it so sign-in works.
      await client.auth.signOut();
    }

    void reconcileSession();

    return () => {
      cancelled = true;
    };
  }, [destination, router]);

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

      const { error: authError } = await client.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (authError) {
        setFieldErrors({ form: mapSignInErrorMessage(authError.message) });
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
            htmlFor="portal-login-email"
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
              id="portal-login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder="you@healthiconnect.com"
              disabled={submitting}
            />
          </div>
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="portal-login-password"
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
              id="portal-login-password"
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
            <LogIn className="h-4 w-4" aria-hidden />
            Sign in
          </>
        )}
      </button>
    </form>
  );
}
