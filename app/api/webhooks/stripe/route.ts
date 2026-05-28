import { handleStripeWebhook } from "@/lib/stripe/handle-webhook";

export async function POST(req: Request) {
  return handleStripeWebhook(req);
}
