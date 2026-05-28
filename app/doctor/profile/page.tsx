import { redirect } from "next/navigation";

export default function DoctorProfileEditPage() {
  redirect("/doctor/dashboard?section=profile");
}
