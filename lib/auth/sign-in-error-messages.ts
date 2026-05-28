export function mapSignInErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "Incorrect email or password. Please try again.";
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return "Too many sign-in attempts. Please wait a few minutes and try again.";
  }

  return message || "Sign in failed. Please try again.";
}
