import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabasePublishableKey) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export function createSupabaseBrowserClient() {
  return createClient(supabaseUrl, supabasePublishableKey);
}
