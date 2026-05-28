import { NextResponse } from "next/server";
import {
  isAuthRateLimitError,
  isAuthUserAlreadyExists,
} from "@/lib/auth/auth-error-messages";
import { completePatientRegistration } from "@/lib/patients/complete-patient-registration";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { patientRegistrationRequestSchema } from "@/lib/validations/patient-auth";

async function findAuthUserIdByEmail(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data.users.length) return null;

    const hit = data.users.find(
      (user) => user.email?.toLowerCase() === normalized,
    );
    if (hit?.id) return hit.id;

    if (data.users.length < perPage) return null;
    page += 1;
    if (page > 10) return null;
  }
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
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

  const parsed = patientRegistrationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { fullName, email, password } = parsed.data;

  let userId: string | undefined;

  const { data: created, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "patient",
      },
    });

  if (createError) {
    if (isAuthRateLimitError(createError.message)) {
      return NextResponse.json(
        {
          error: "Email rate limit exceeded",
          details: createError.message,
          code: "auth_rate_limit",
        },
        { status: 429 },
      );
    }

    if (isAuthUserAlreadyExists(createError.message)) {
      userId = (await findAuthUserIdByEmail(supabaseAdmin, email)) ?? undefined;

      if (!userId) {
        return NextResponse.json(
          {
            error: "An account with this email already exists.",
            details: "Sign in with that email instead.",
            code: "user_exists",
          },
          { status: 409 },
        );
      }
    } else {
      return NextResponse.json(
        {
          error: "Failed to create account",
          details: createError.message,
        },
        { status: 500 },
      );
    }
  } else {
    userId = created.user?.id;
  }

  if (!userId) {
    return NextResponse.json(
      {
        error: "Failed to create account",
        details: "User id was missing after signup.",
      },
      { status: 500 },
    );
  }

  const result = await completePatientRegistration(supabaseAdmin, {
    userId,
    fullName,
    email,
  });

  if (!result.ok) {
    const status =
      result.message.includes("already exists") ||
      result.message.includes("different role")
        ? 409
        : 500;

    return NextResponse.json(
      {
        error:
          result.step === "profile"
            ? "Failed to create profile"
            : "Failed to create patient record",
        details: result.message,
      },
      { status },
    );
  }

  return NextResponse.json({ success: true });
}
