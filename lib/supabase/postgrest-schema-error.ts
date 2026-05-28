import type { PostgrestError } from "@supabase/supabase-js";

/** True when PostgREST rejects a column or the schema cache is stale. */
export function isPostgrestSchemaError(error: PostgrestError): boolean {
  return (
    error.code === "PGRST204" ||
    error.message.includes("schema cache") ||
    error.message.includes("column") ||
    error.message.includes("does not exist")
  );
}
