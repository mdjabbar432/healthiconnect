import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const newsletterRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
});

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

  const parsed = newsletterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  try {
    const { data: existingSubscriber, error: checkError } = await admin
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      if (checkError.code === "PGRST205" || checkError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Newsletter table is missing in the active Supabase project. Run the newsletter migration and retry.",
          },
          { status: 500 },
        );
      }
      throw checkError;
    }

    if (existingSubscriber) {
      return NextResponse.json(
        { error: "You are already subscribed!" },
        { status: 400 },
      );
    }

    const { data: insertedRows, error: insertError } = await admin
      .from("newsletter_subscribers")
      .insert({ email });

    if (insertError) {
      console.error("NEWSLETTER_INSERT_ERROR:", insertError);
    }

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You are already subscribed!" },
          { status: 400 },
        );
      }

      if (insertError.code === "PGRST205" || insertError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              "Newsletter table is missing. Run the latest Supabase migrations and try again.",
          },
          { status: 500 },
        );
      }

      throw insertError;
    }

    console.log("NEWSLETTER_INSERT_SUCCESS:", insertedRows);
    return NextResponse.json({ success: true, message: "Thank you for subscribing! 🎉" });
  } catch (error) {
    console.error("NEWSLETTER_ERROR_DETAILS:", error);
    console.error("Newsletter subscription failed:", error);
    return NextResponse.json(
      { error: "Unable to process your subscription right now. Please try again." },
      { status: 500 },
    );
  }
}
