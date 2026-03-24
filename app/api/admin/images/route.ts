import { NextResponse } from "next/server";
import { requireSuperadminForApi } from "@/lib/admin/require-superadmin-api";

type SupabaseImageRow = {
  id: string | number;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
  url: string | null;
};

export async function POST(request: Request) {
  const auth = await requireSuperadminForApi();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as { url?: unknown };
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return NextResponse.json({ error: "Image URL is required." }, { status: 400 });
  }

  const selectColumns = "id, created_datetime_utc, modified_datetime_utc, url";

  const insertBase = await auth.supabase
    .from("images")
    .insert({
      url,
      created_by_user_id: auth.profileId,
      modified_by_user_id: auth.profileId,
    })
    .select(selectColumns)
    .maybeSingle<SupabaseImageRow>();

  if (insertBase.error) {
    return NextResponse.json({ error: `Failed to create image: ${insertBase.error.message}` }, { status: 400 });
  }

  return NextResponse.json({ row: insertBase.data, message: "Image created successfully." });
}
