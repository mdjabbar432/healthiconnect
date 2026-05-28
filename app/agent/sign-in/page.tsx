import { AgentAuthPage } from "@/components/agent/agent-auth-page";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";

export const metadata = {
  title: "Agent Sign In | HealthiConnect",
  description:
    "Sign in to your HealthiConnect insurance agent dashboard to track referrals and commissions.",
};

type PageProps = {
  searchParams?: Promise<{ redirect?: string | string[] }>;
};

async function resolveRedirect(
  searchParams: PageProps["searchParams"],
): Promise<string | undefined> {
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.redirect;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  return sanitizeRedirectPath(value, "/agent/dashboard");
}

export default async function AgentSignInPage({ searchParams }: PageProps) {
  const redirectTo = await resolveRedirect(searchParams);

  return <AgentAuthPage mode="sign-in" redirectTo={redirectTo} />;
}
