import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

let adminClient: SupabaseClient | null = null;

/** Needed for `/doctors` and other server fetches via the service role. */
export function isSupabaseServerConfigured(): boolean {
  return supabaseUrl.length > 0 && supabaseServiceRoleKey.length > 0;
}

function createSupabaseAdmin(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Lazy service-role client. Returns null when env vars are missing (never throws on access).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  if (!adminClient) {
    adminClient = createSupabaseAdmin();
  }

  return adminClient;
}

export function requireSupabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }
  return client;
}

/** @deprecated Prefer getSupabaseAdmin() — safe null when unconfigured. */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
      );
    }
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
