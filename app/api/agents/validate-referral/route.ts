import { NextResponse } from "next/server";
import { resolveAgentByReferralCode } from "@/lib/agents/resolve-referral-code";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { agentReferralCodeSchema } from "@/lib/validations/agent-auth";

export async function GET(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = agentReferralCodeSchema.safeParse(
    searchParams.get("code") ?? "",
  );

  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, error: "Invalid agent ID format." },
      { status: 400 },
    );
  }

  const agent = await resolveAgentByReferralCode(admin, parsed.data);

  if (!agent) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    referralCode: agent.referralCode,
  });
}
