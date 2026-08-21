import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";

export type AuthUserRole = "patient" | "doctor" | "agent";

export type CreateConfirmedUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: AuthUserRole;
};

/**
 * Creates an Auth user via the service-role Admin API.
 * `email_confirm: true` lets the user sign in immediately (no confirmation email).
 */
export async function createConfirmedAuthUser(
  admin: SupabaseClient,
  input: CreateConfirmedUserInput,
): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email.toLowerCase(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      role: input.role,
    },
  });

  return { user: data.user ?? null, error };
}
