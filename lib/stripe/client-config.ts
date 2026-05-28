export function isStripePublishableConfigured(): boolean {
  const key = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "").trim();
  return key.length > 0 && key.startsWith("pk_");
}
