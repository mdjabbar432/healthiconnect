import type { DoctorSessionProfile } from "@/lib/doctors/fetch-doctor-profile";
import { DoctorEditProfile } from "@/components/doctor/doctor-edit-profile";
import { DoctorMyPatients } from "@/components/doctor/doctor-my-patients";
import { DoctorMyReviews } from "@/components/doctor/doctor-my-reviews";
import {
  DOCTOR_SECTION_COPY,
  type DoctorDashboardSection,
} from "@/components/doctor/doctor-dashboard-sections";

export type DoctorDashboardContentProps = {
  doctor: DoctorSessionProfile;
  section: DoctorDashboardSection;
};

export function DoctorDashboardContent({
  doctor,
  section,
}: DoctorDashboardContentProps) {
  const { title, description } = DOCTOR_SECTION_COPY[section];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          {description}
        </p>
        {section === "overview" && doctor.slug ? (
          <p className="mt-2 text-xs text-slate-500">
            Public profile:{" "}
            <span className="font-medium text-slate-700">/doctors/{doctor.slug}</span>
          </p>
        ) : null}
      </div>

      {section === "overview" ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <DoctorMyPatients doctorId={doctor.id} />
            <DoctorMyReviews doctorId={doctor.id} />
          </div>
          <DoctorEditProfile doctorId={doctor.id} />
        </>
      ) : null}

      {section === "patients" ? <DoctorMyPatients doctorId={doctor.id} /> : null}
      {section === "reviews" ? <DoctorMyReviews doctorId={doctor.id} /> : null}
      {section === "profile" ? <DoctorEditProfile doctorId={doctor.id} /> : null}
    </div>
  );
}
