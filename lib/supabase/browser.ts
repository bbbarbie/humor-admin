import { createBrowserClient } from "@supabase/ssr";

function getEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
}

const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabasePublishableKey = getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);
