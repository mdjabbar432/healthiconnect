import { PatientAuthPage } from "@/components/patient/patient-auth-page";

export const metadata = {
  title: "Patient Sign In | HealthiConnect",
  description:
    "Sign in to your HealthiConnect patient account to leave reviews and manage your care.",
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

export default async function SignInPage({ searchParams }: PageProps) {
  const redirectTo = await resolveRedirect(searchParams);
  return <PatientAuthPage mode="sign-in" redirectTo={redirectTo} />;
}
