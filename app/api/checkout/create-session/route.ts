import { NextResponse } from "next/server";
import { createMembershipCheckoutSession } from "@/lib/membership/create-checkout-session";
import { membershipCheckoutSchema } from "@/lib/validations/checkout";

/** @deprecated Prefer POST /api/checkout — kept for backward compatibility */
export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = membershipCheckoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createMembershipCheckoutSession(parsed.data);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ url: result.url, sessionId: result.sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
