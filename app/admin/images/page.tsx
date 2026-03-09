import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ALERT_ERROR } from "@/components/admin/theme";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/ui";
import { ImagesAdminClient, type ImageRow } from "./images-admin-client";

export default async function AdminImagesPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("images")
    .select("id, created_datetime_utc, modified_datetime_utc, url")
    .order("created_datetime_utc", { ascending: false });

  const rows = ((data ?? []) as ImageRow[]).map((row) => ({
    id: row.id,
    created_datetime_utc: row.created_datetime_utc ?? null,
    modified_datetime_utc: row.modified_datetime_utc ?? null,
    url: row.url ?? "",
  }));

  return (
    <AdminPageShell>
      <AdminPageHeader title="Images" subtitle="Manage image records in the dataset." />

      {error ? (
        <p className={ADMIN_ALERT_ERROR}>Failed to load images: {error.message}</p>
      ) : null}

      <ImagesAdminClient initialRows={rows} />
    </AdminPageShell>
  );
}
