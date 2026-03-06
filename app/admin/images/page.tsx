import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ALERT_ERROR, ADMIN_PAGE_HEADER, ADMIN_PAGE_SUBTITLE, ADMIN_PAGE_TITLE } from "@/components/admin/theme";
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
    <section className="space-y-6">
      <div className={ADMIN_PAGE_HEADER}>
        <h2 className={ADMIN_PAGE_TITLE}>Images</h2>
        <p className={ADMIN_PAGE_SUBTITLE}>Manage image records in the dataset.</p>
      </div>

      {error ? (
        <p className={ADMIN_ALERT_ERROR}>
          Failed to load images: {error.message}
        </p>
      ) : null}

      <ImagesAdminClient initialRows={rows} />
    </section>
  );
}
