"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Loader2,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { mapSignInErrorMessage } from "@/lib/auth/sign-in-error-messages";
import { fetchAgentSessionForUser } from "@/lib/agents/fetch-agent-session";
import {
  getSupabaseClient,
  isSupabaseClientConfigured,
} from "@/lib/supabase/client";
import {
  agentSignInSchema,
  agentSignUpSchema,
} from "@/lib/validations/agent-auth";

const inputClassName =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-hc-brand focus:outline-none focus:ring-2 focus:ring-hc-brand/20 disabled:opacity-50";

type AuthMode = "sign-in" | "sign-up";

type FieldErrors = Partial<
  Record<"fullName" | "email" | "password" | "governmentId" | "form", string>
>;

export type AgentAuthFormProps = {
  mode: AuthMode;
  redirectTo?: string;
};

export function AgentAuthForm({ mode, redirectTo }: AgentAuthFormProps) {
  const router = useRouter();
  const destination = sanitizeRedirectPath(redirectTo, "/agent/dashboard");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [governmentId, setGovernmentId] = useState("");
  const [newReferralCode, setNewReferralCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const isSignUp = mode === "sign-up";

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

      const session = await fetchAgentSessionForUser(userId);
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

  async function handleSignIn() {
    const parsed = agentSignInSchema.safeParse({ email, password });
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
        form: "Authentication is not configured. Set Supabase environment variables.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const client = getSupabaseClient();
      if (!client) {
        setFieldErrors({ form: "Authentication is not configured." });
        return;
      }

      const { data: authData, error: authError } =
        await client.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

      if (authError) {
        setFieldErrors({ form: mapSignInErrorMessage(authError.message) });
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setFieldErrors({
          form: "Sign in succeeded but no user was returned. Please try again.",
        });
        return;
      }

      const session = await fetchAgentSessionForUser(userId);
      if (!session) {
        await client.auth.signOut();
        setFieldErrors({
          form: "No insurance agent profile found for this account. Register as an agent first.",
        });
        return;
      }

      router.replace(destination);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp() {
    const parsed = agentSignUpSchema.safeParse({
      fullName,
      email,
      password,
      governmentId: governmentId.trim() || undefined,
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

    setSubmitting(true);

    try {
      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = (await res.json()) as {
        error?: string;
        details?: string;
        referralCode?: string;
      };

      if (!res.ok) {
        setFieldErrors({
          form: data.details ?? data.error ?? "Registration failed. Please try again.",
        });
        return;
      }

      if (!isSupabaseClientConfigured()) {
        setFieldErrors({ form: "Authentication is not configured." });
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        setFieldErrors({ form: "Authentication is not configured." });
        return;
      }

      const { error: signInError } = await client.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (signInError) {
        setFieldErrors({
          form: `Account created. Sign in manually. ${mapSignInErrorMessage(signInError.message)}`,
        });
        if (data.referralCode) setNewReferralCode(data.referralCode);
        return;
      }

      if (data.referralCode) {
        setNewReferralCode(data.referralCode);
      }

      router.replace(destination);
    } catch {
      setFieldErrors({
        form: "Network error. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setNewReferralCode(null);

    if (isSignUp) {
      await handleSignUp();
    } else {
      await handleSignIn();
    }
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
        <Loader2 className="h-8 w-8 animate-spin text-hc-brand" aria-hidden />
        <span className="sr-only">Checking session…</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {fieldErrors.form ? (
          <div
            className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>{fieldErrors.form}</p>
          </div>
        ) : null}

        {newReferralCode ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Your unique Agent ID</p>
            <p className="mt-1 font-mono text-base tracking-wide">{newReferralCode}</p>
            <p className="mt-2 text-emerald-800">
              Share this code with patients at checkout to earn referral commissions.
            </p>
          </div>
        ) : null}

        {isSignUp ? (
          <div>
            <label htmlFor="agent-full-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <div className="relative">
              <UserRound
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="agent-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClassName} pl-10`}
                placeholder="Jane Agent"
                disabled={submitting}
              />
            </div>
            {fieldErrors.fullName ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label htmlFor="agent-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="agent-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder="you@agency.com"
              disabled={submitting}
            />
          </div>
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="agent-password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="agent-password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClassName} pl-10`}
              placeholder="••••••••"
              disabled={submitting}
            />
          </div>
          {fieldErrors.password ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        {isSignUp ? (
          <div>
            <label
              htmlFor="agent-government-id"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Government ID <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <BadgeCheck
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                id="agent-government-id"
                type="text"
                value={governmentId}
                onChange={(e) => setGovernmentId(e.target.value)}
                className={`${inputClassName} pl-10`}
                placeholder="License or ID number"
                disabled={submitting}
              />
            </div>
            {fieldErrors.governmentId ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.governmentId}</p>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hc-brand px-5 py-3 text-sm font-bold text-white transition hover:bg-hc-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hc-brand disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {isSignUp ? "Creating account…" : "Signing in…"}
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4" aria-hidden />
              {isSignUp ? "Create agent account" : "Sign in"}
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {isSignUp ? (
          <>
            Already registered?{" "}
            <Link href="/agent/sign-in" className="font-semibold text-hc-brand hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New insurance agent?{" "}
            <Link href="/agent/sign-up" className="font-semibold text-hc-brand hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
