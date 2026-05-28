import { NextResponse } from "next/server";
import { createPartner } from "@/lib/admin/create-partner";
import { fetchAdminPartners } from "@/lib/admin/fetch-partners";
import type { PartnerType } from "@/lib/admin/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const PARTNER_TYPES: PartnerType[] = ["lab", "pharmacy", "radiology", "other"];

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  const { partners, error } = await fetchAdminPartners(admin);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load partners", details: error },
      { status: 500 },
    );
  }

  return NextResponse.json({ partners });
}

export async function POST(req: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as {
    name?: string;
    type?: string;
    address?: string;
    description?: string;
  };

  const name = payload.name?.trim() ?? "";
  const type = payload.type?.trim() as PartnerType;
  const address = payload.address?.trim() ?? "";
  const description = payload.description?.trim() ?? "";

  if (!name) {
    return NextResponse.json({ error: "Partner name is required." }, { status: 400 });
  }

  if (!PARTNER_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid partner type." }, { status: 400 });
  }

  const { partnerId, error } = await createPartner(admin, {
    name,
    type,
    address,
    description,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to create partner", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, id: partnerId });
}
