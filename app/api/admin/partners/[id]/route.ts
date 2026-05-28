import { NextResponse } from "next/server";
import { deletePartnerById } from "@/lib/admin/delete-partner";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const partnerId = Number.parseInt(id ?? "", 10);

  if (!Number.isFinite(partnerId) || partnerId <= 0) {
    return NextResponse.json({ error: "Valid partner id is required." }, { status: 400 });
  }

  const { error } = await deletePartnerById(admin, partnerId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete partner", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: partnerId });
}
