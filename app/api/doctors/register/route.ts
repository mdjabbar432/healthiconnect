import { NextResponse } from "next/server";
import {
  AUTH_RATE_LIMIT_NO_BYPASS_MESSAGE,
  AUTH_RATE_LIMIT_USER_MESSAGE,
  isAuthRateLimitError,
  isAuthUserAlreadyExists,
} from "@/lib/auth/auth-error-messages";
import { createConfirmedAuthUser } from "@/lib/auth/create-confirmed-user";
import { isDevRegistrationBypassEnabled } from "@/lib/env/dev-registration";
import { completeDoctorRegistration } from "@/lib/doctors/complete-doctor-registration";
import { createDraftDoctorApplication } from "@/lib/doctors/create-draft-doctor-application";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  doctorRegistrationRequestSchema,
  doctorRegistrationWithUserIdSchema,
} from "@/lib/validations/doctor-registration";

export const runtime = "nodejs";

const ADMIN_NOT_CONFIGURED =
  "Supabase is not configured on the server. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof getSupabaseAdmin>,
  email: string,
): Promise<string | null> {
  if (!admin) return null;

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
    return NextResponse.json({ error: ADMIN_NOT_CONFIGURED }, { status: 503 });
  }

  const body = await req.json();

  const withUserId = doctorRegistrationWithUserIdSchema.safeParse(body);
  const withPassword = doctorRegistrationRequestSchema.safeParse(body);

  if (!withUserId.success && !withPassword.success) {
    return NextResponse.json(
      {
        error: "Invalid registration data",
        details: (withPassword.error ?? withUserId.error).flatten(),
      },
      { status: 400 },
    );
  }

  const registration = withPassword.success
    ? withPassword.data
    : withUserId.data!;

  const {
    fullName,
    email,
    licenseNumber,
    bio,
    specialty,
    language,
    location,
    photoUrl,
  } = registration;

  let userId: string | undefined = withUserId.success
    ? withUserId.data!.userId
    : undefined;

  if (!userId && withPassword.success) {
    const { user: created, error: createError } = await createConfirmedAuthUser(
      supabaseAdmin,
      {
        email,
        password: withPassword.data.password,
        fullName,
        role: "doctor",
      },
    );

    if (createError) {
      console.error(
        "[POST /api/doctors/register] auth.admin.createUser:",
        createError,
      );

      if (isAuthRateLimitError(createError.message)) {
        if (isDevRegistrationBypassEnabled()) {
          const draft = await createDraftDoctorApplication(supabaseAdmin, {
            fullName,
            email,
            licenseNumber,
            bio,
            specialty,
            language,
            location,
            photoUrl,
          });

          if (draft.ok) {
            return NextResponse.json({
              success: true,
              draft: true,
              slug: draft.slug,
              message: AUTH_RATE_LIMIT_USER_MESSAGE,
            });
          }

          return NextResponse.json(
            {
              error: "Email rate limit exceeded",
              details: draft.message,
              code: "auth_rate_limit",
            },
            { status: 429 },
          );
        }

        return NextResponse.json(
          {
            error: "Email rate limit exceeded",
            details: AUTH_RATE_LIMIT_NO_BYPASS_MESSAGE,
            code: "auth_rate_limit",
          },
          { status: 429 },
        );
      }

      if (isAuthUserAlreadyExists(createError.message)) {
        userId =
          (await findAuthUserIdByEmail(supabaseAdmin, email)) ?? undefined;

        if (!userId) {
          return NextResponse.json(
            {
              error: "An account with this email already exists.",
              details: "Sign in with that email, or use a different address.",
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
      userId = created?.id;
    }
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

  const { data: authUser, error: authLookupError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (authLookupError || !authUser?.user) {
    return NextResponse.json(
      { error: "Auth account not found. Please try again." },
      { status: 400 },
    );
  }

  if (
    authUser.user.email &&
    authUser.user.email.toLowerCase() !== email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Email does not match the authenticated account." },
      { status: 400 },
    );
  }

  const result = await completeDoctorRegistration(supabaseAdmin, {
    userId,
    fullName,
    email,
    licenseNumber,
    bio,
    specialty,
    language,
    location,
    photoUrl: photoUrl?.trim() || undefined,
  });

  if (!result.ok) {
    console.error(
      `[POST /api/doctors/register] ${result.step}:`,
      result.message,
    );

    const status =
      result.message.includes("already exists") ? 409 : 500;

    return NextResponse.json(
      {
        error:
          result.step === "profile"
            ? "Failed to create profile"
            : result.step === "doctor"
              ? "Failed to save doctor profile"
              : "Failed to link specialty",
        details: result.message,
      },
      { status },
    );
  }

  return NextResponse.json({
    success: true,
    slug: result.slug,
    draft: false,
  });
}
