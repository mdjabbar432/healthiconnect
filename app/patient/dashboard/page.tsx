import { PatientDashboard } from "@/components/patient/patient-dashboard";
import { SiteFooter } from "@/components/home/site-footer";

export const metadata = {
  title: "Patient Dashboard | HealthiConnect",
  description:
    "View your membership plan, chosen doctor (name and specialty), and linked insurance agent.",
};

export default function PatientDashboardPage() {
  return (
    <>
      <PatientDashboard />
      <SiteFooter />
    </>
  );
}
