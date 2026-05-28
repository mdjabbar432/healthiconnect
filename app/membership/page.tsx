import { MembershipPageClient } from "@/components/membership/membership-page-client";
import type { CheckoutDoctorOption } from "@/components/membership/membership-checkout-modal";
import { SiteFooter } from "@/components/home/site-footer";
import { mapDirectoryRowsToItems } from "@/lib/doctors/map-directory-doctor";
import { fetchDirectoryDoctors } from "@/lib/doctors/fetch-directory-doctors";
import { fetchMembershipPlans } from "@/lib/membership/fetch-plans";
import { isStripeConfigured } from "@/lib/stripe/config";

export const metadata = {
  title: "Membership Plans | HealthiConnect",
  description:
    "Compare Basic and Premium membership tiers, choose your doctor, and subscribe with Stripe Checkout.",
};

export default async function MembershipPage() {
  const [plans, { doctors: doctorRows }] = await Promise.all([
    fetchMembershipPlans(),
    fetchDirectoryDoctors(),
  ]);

  const checkoutDoctors: CheckoutDoctorOption[] = mapDirectoryRowsToItems(
    doctorRows,
  ).map((doctor) => ({
    id: doctor.id,
    fullName: doctor.fullName,
    specialties: doctor.specialties,
    city: doctor.city,
  }));

  return (
    <>
      <MembershipPageClient
        plans={plans}
        doctors={checkoutDoctors}
        stripeLive={isStripeConfigured()}
      />
      <SiteFooter />
    </>
  );
}
