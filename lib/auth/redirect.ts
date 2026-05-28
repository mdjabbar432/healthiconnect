/** Only allow same-origin relative paths (prevents open redirects). */
export function sanitizeRedirectPath(
  value: string | null | undefined,
  fallback = "/patient/dashboard",
): string {
  if (!value || typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("\\") || trimmed.includes("\0")) {
    return fallback;
  }

  return trimmed;
}
