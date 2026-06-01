import type { Metadata } from "next";
import { SiteFooter } from "@/components/home";
import { SpecialtiesContent } from "@/components/specialties/specialties-content";

export const metadata: Metadata = {
  title: "Specialties | HealthiConnect",
  description:
    "Browse medical specialties and connect with verified doctors across cardiology, neurology, pediatrics, and more.",
};

export default function SpecialtiesPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <SpecialtiesContent />
      </main>
      <SiteFooter />
    </>
  );
}
