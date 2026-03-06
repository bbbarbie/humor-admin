import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore set errors in unsupported contexts
        }
      },
    },
  });
}
