import { CircleCheck } from "lucide-react";
import { CheckoutResult } from "@/components/membership/checkout-result";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string; mock?: string; plan?: string }>;
};

export const metadata = {
  title: "Subscription confirmed | HealthiConnect",
};

export default async function MembershipSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const isMock = params.mock === "1";

  return (
    <CheckoutResult
      variant="success"
      icon={CircleCheck}
      title="Welcome to HealthiConnect"
      description={
        isMock
          ? `Demo mode: Stripe is not configured yet. When you add STRIPE_SECRET_KEY, checkout will use live Stripe instead. Plan preview: ${params.plan ?? "membership"}.`
          : "Your payment was received. Your membership tier will appear in your dashboard once Stripe confirms the subscription (usually within a minute)."
      }
      sessionId={sessionId ?? (isMock ? `mock_${params.plan ?? "plan"}` : undefined)}
    />
  );
}
