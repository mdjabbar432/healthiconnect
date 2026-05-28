import { DoctorRegisterPageContent } from "@/components/doctor-register-page-content";
import { SiteFooter } from "@/components/home/site-footer";
import "../../homepage-sections.css";

export const metadata = {
  title: "Doctor Registration | HealthiConnect",
  description:
    "Apply to join HealthiConnect as a verified doctor. Your profile will be reviewed before going live.",
};

export default function DoctorRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <DoctorRegisterPageContent />
      <SiteFooter />
    </div>
  );
}
