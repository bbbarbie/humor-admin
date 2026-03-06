import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseImageRow = {
  id: string | number;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
  url: string | null;
};

async function requireSuperadmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: NextResponse.json({ error: `Failed to verify profile: ${profileError.message}` }, { status: 500 }),
    };
  }

  if (profile?.is_superadmin !== true) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase };
}

export async function POST(request: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
  }

  const selectColumns = "id, created_datetime_utc, modified_datetime_utc, url";

  const insertBase = await auth.supabase
    .from("images")
    .insert({ url })
    .select(selectColumns)
    .maybeSingle<SupabaseImageRow>();

  if (!insertBase.error) {
    return NextResponse.json({ row: insertBase.data, message: "Image created successfully." });
  }

  const message = insertBase.error.message.toLowerCase();
  const requiresTimestamps =
    message.includes("created_datetime_utc") ||
    message.includes("modified_datetime_utc") ||
    message.includes("null value") ||
    message.includes("not-null");

  if (!requiresTimestamps) {
    return NextResponse.json({ error: `Failed to create image: ${insertBase.error.message}` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const insertWithTimestamps = await auth.supabase
    .from("images")
    .insert({
      url,
      created_datetime_utc: now,
      modified_datetime_utc: now,
    })
    .select(selectColumns)
    .maybeSingle<SupabaseImageRow>();

  if (insertWithTimestamps.error) {
    return NextResponse.json({ error: `Failed to create image: ${insertWithTimestamps.error.message}` }, { status: 400 });
  }

  return NextResponse.json({ row: insertWithTimestamps.data, message: "Image created successfully." });
}
