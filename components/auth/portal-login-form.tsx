"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { fetchAuthSessionFromApi } from "@/lib/auth/fetch-auth-session";
import { resolvePostLoginPath } from "@/lib/auth/route-access";
import { mapSignInErrorMessage } from "@/lib/auth/sign-in-error-messages";
import { withTimeout } from "@/lib/auth/with-timeout";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import { doctorLoginFormSchema } from "@/lib/validations/doctor-login";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

const SIGN_IN_TIMEOUT_MS = 15_000;

type FieldErrors = Partial<Record<"email" | "password" | "form", string>>;

export type PortalLoginFormProps = {
  redirectTo?: string;
};

export function PortalLoginForm({ redirectTo }: PortalLoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseClientConfigured()) return;

    let cancelled = false;

    async function reconcileSession() {
      const client = getSupabaseClient();
      if (!client || cancelled) return;

      const { data } = await client.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken || cancelled) return;

      const session = await fetchAuthSessionFromApi(accessToken).catch(
        () => null,
      );
      if (cancelled) return;

      if (!session?.role) {
        // Stale session or missing profile — clear it so a new sign-in can proceed.
        await client.auth.signOut();
        return;
      }

      router.replace(resolvePostLoginPath(session.role, redirectTo));
    }

    void reconcileSession();

    return () => {
      cancelled = true;
    };
  }, [redirectTo, router]);

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

    setIsLoading(true);

    const client = getSupabaseClient();
    let establishedSession = false;

    try {
      if (!client) {
        setFieldErrors({
          form: "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        });
        return;
      }

      const { data: authData, error: authError } = await withTimeout(
        client.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
        SIGN_IN_TIMEOUT_MS,
        "Sign-in timed out. Check your connection and try again.",
      );

      if (authError) {
        setFieldErrors({ form: mapSignInErrorMessage(authError.message) });
        return;
      }

      establishedSession = true;

      const accessToken = authData.session?.access_token;
      if (!authData.user?.id || !accessToken) {
        await client.auth.signOut();
        setFieldErrors({
          form: "Sign in succeeded but no session was returned. Please try again.",
        });
        return;
      }

      const session = await fetchAuthSessionFromApi(accessToken);
      if (!session?.role) {
        await client.auth.signOut();
        setFieldErrors({
          form: "We could not load your profile role. Please contact support.",
        });
        return;
      }

      if (session.role === "patient") {
        await client.auth.signOut();
        setFieldErrors({
          form: "This portal is for staff accounts. Use the patient sign-in page.",
        });
        return;
      }

      const destination = resolvePostLoginPath(session.role, redirectTo);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      if (!establishedSession) {
        await client?.auth.signOut().catch(() => {});
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Check your connection and try again.";
      setFieldErrors({ form: message });
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[10px] bg-hc-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-hc-brand-hover disabled:opacity-60"
      >
        {isLoading ? (
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
