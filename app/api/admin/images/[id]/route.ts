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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!id) {
    return NextResponse.json({ error: "Image id is required." }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("images")
    .update({
      url,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, created_datetime_utc, modified_datetime_utc, url")
    .maybeSingle<SupabaseImageRow>();

  if (error) {
    return NextResponse.json({ error: `Failed to update image: ${error.message}` }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return NextResponse.json({ row: data, message: "Image updated successfully." });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Image id is required." }, { status: 400 });
  }

  const { error } = await auth.supabase.from("images").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: `Failed to delete image: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ message: "Image deleted successfully." });
}
