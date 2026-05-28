export function isAuthRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("email rate limit")
  );
}

export function isAuthUserAlreadyExists(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address has already been registered")
  );
}

export const AUTH_RATE_LIMIT_USER_MESSAGE =
  "Supabase email signup is temporarily rate-limited. In development, we saved your application as a draft so you can keep testing. Wait a few minutes, disable confirm-email in Supabase Auth settings, or try again with a different email.";

export const AUTH_RATE_LIMIT_NO_BYPASS_MESSAGE =
  "Email signup is temporarily rate-limited. Please wait a few minutes and try again, or use a different email address.";
