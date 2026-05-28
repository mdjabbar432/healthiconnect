export function formatDoctorLocation(
  city: string | null,
  country: string | null,
): string {
  const parts = [city, country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}
