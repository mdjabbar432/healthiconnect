import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
).trim();

let adminClient: SupabaseClient | null = null;

const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.";

/** True when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set. */
export function isSupabaseServerConfigured(): boolean {
  return supabaseUrl.length > 0 && supabaseServiceRoleKey.length > 0;
}

/**
 * Service-role client: bypasses RLS and is required for auth.admin.*
 * (createUser, getUserById, listUsers). Never use the anon key here —
 * GoTrue returns "User not allowed" for admin APIs without service_role.
 */
function createSupabaseAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Lazy server admin client using NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Returns null when those env vars are missing (never throws on access).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  if (!adminClient) {
    adminClient = createSupabaseAdminClient();
  }

  return adminClient;
}

export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(ADMIN_NOT_CONFIGURED_MESSAGE);
  }
  return client;
}

/** @deprecated Prefer getSupabaseAdmin() — safe null when unconfigured. */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error(ADMIN_NOT_CONFIGURED_MESSAGE);
    }
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
