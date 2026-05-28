import { redirect } from "next/navigation";

export default function DoctorPatientsPage() {
  redirect("/doctor/dashboard?section=patients");
}
