/** True when local-only registration shortcuts are allowed (never enable in production). */
export function isDevRegistrationBypassEnabled(): boolean {
  if (process.env.ALLOW_DOCTOR_REGISTRATION_DEV_BYPASS === "true") {
    return true;
  }

  return process.env.NODE_ENV === "development";
}

export function isPublicDevRegistrationHintEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_DOCTOR_REGISTRATION === "true";
}
