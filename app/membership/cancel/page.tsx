import { CircleX } from "lucide-react";
import { CheckoutResult } from "@/components/membership/checkout-result";

export const metadata = {
  title: "Checkout cancelled | HealthiConnect",
};

export default function MembershipCancelPage() {
  return (
    <CheckoutResult
      variant="cancel"
      icon={CircleX}
      title="Checkout cancelled"
      description="No charges were made. You can return anytime to pick a plan that fits your care needs."
    />
  );
}
