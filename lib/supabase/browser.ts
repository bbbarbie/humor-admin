"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
