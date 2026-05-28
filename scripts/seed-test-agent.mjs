/**
 * Creates a demo insurance agent with referral code AG-TEST123.
 * Usage: node scripts/seed-test-agent.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing .env.local — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const REFERRAL_CODE = "AG-TEST123";
const TEST_EMAIL = "test-agent@healthiconnect.demo";
const TEST_PASSWORD = "TestAgent123!";
const TEST_NAME = "Test Insurance Agent";

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase URL or service role key missing in .env.local");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin
    .from("agents")
    .select("id, referral_code")
    .eq("referral_code", REFERRAL_CODE)
    .maybeSingle();

  if (existing) {
    console.log(JSON.stringify({ ok: true, alreadyExists: true, referralCode: REFERRAL_CODE, agentId: existing.id }, null, 2));
    return;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: TEST_NAME, role: "agent" },
  });

  if (createError) {
    if (!createError.message.toLowerCase().includes("already")) {
      throw createError;
    }

    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    const hit = list?.users?.find((u) => u.email?.toLowerCase() === TEST_EMAIL);
    if (!hit?.id) throw createError;

    const userId = hit.id;
    await admin.from("profiles").upsert({ id: userId, role: "agent", full_name: TEST_NAME });
    const { error: agentError } = await admin.from("agents").upsert({
      id: userId,
      referral_code: REFERRAL_CODE,
    });
    if (agentError) throw agentError;

    console.log(
      JSON.stringify(
        {
          ok: true,
          referralCode: REFERRAL_CODE,
          agentId: userId,
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        },
        null,
        2,
      ),
    );
    return;
  }

  const userId = created.user?.id;
  if (!userId) throw new Error("createUser succeeded but no user id returned");

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    role: "agent",
    full_name: TEST_NAME,
  });

  if (profileError) throw profileError;

  const { error: agentError } = await admin.from("agents").insert({
    id: userId,
    referral_code: REFERRAL_CODE,
    government_id: "TEST-LICENSE-001",
  });

  if (agentError) throw agentError;

  console.log(
    JSON.stringify(
      {
        ok: true,
        referralCode: REFERRAL_CODE,
        agentId: userId,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        signInUrl: "/agent/sign-in",
        dashboardUrl: "/agent/dashboard",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
