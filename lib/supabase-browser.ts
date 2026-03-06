import { createClient } from "@supabase/supabase-js";

function getEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabasePublishableKey = getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

export function createSupabaseBrowserClient() {
  return createClient(supabaseUrl, supabasePublishableKey);
}
