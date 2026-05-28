import { redirect } from "next/navigation";

export default function DoctorReviewsPage() {
  redirect("/doctor/dashboard?section=reviews");
}
