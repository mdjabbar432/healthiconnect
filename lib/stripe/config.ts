export function isStripeConfigured(): boolean {
  const secret = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  return secret.length > 0 && secret.startsWith("sk_");
}
