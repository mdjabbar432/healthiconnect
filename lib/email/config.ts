/** Replace with the client's inbox when available (or set APPOINTMENT_NOTIFY_EMAIL in .env.local). */
export const DEFAULT_APPOINTMENT_NOTIFY_EMAIL = "shantchokder@gmail.com";

export function getAppointmentNotifyEmail(): string {
  return (
    process.env.APPOINTMENT_NOTIFY_EMAIL?.trim() ||
    DEFAULT_APPOINTMENT_NOTIFY_EMAIL
  );
}

export function getEmailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "HealthiConnect <onboarding@resend.dev>"
  );
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
