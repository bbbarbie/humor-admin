import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImageThumbnail } from "@/components/admin/image-thumbnail";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_INPUT,
  ADMIN_PAGE_HEADER,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SELECT,
  ADMIN_STAT_CARD,
  ADMIN_TABLE_HEAD,
  ADMIN_TABLE_WRAPPER,
} from "@/components/admin/theme";

type PrimitiveId = string | number;

type CaptionRow = {
  content: string | null;
  is_public: boolean | null;
  profile_id: string | null;
  image_id: PrimitiveId | null;
  like_count: number | null;
};

type ImageLookupRow = {
  id: PrimitiveId | null;
  url: string | null;
};

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type VisibilityFilter = "all" | "public" | "private";

function readVisibility(value: string | string[] | undefined): VisibilityFilter {
  const normalized = readQueryValue(value).trim().toLowerCase();
  if (normalized === "public") return "public";
  if (normalized === "private") return "private";
  return "all";
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className={ADMIN_STAT_CARD}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-100">{value}</p>
    </div>
  );
}

export default async function AdminCaptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = readQueryValue(params.search).trim().toLowerCase();
  const visibility = readVisibility(params.visibility);

  const supabase = await createSupabaseServerClient();
  let rows: CaptionRow[] = [];
  let errorMessage: string | null = null;

  const captionsQuery = await supabase.from("captions").select("content, is_public, profile_id, image_id, like_count").limit(1000);

  if (captionsQuery.error) {
    errorMessage = captionsQuery.error.message;
  } else {
    rows = (captionsQuery.data ?? []) as CaptionRow[];
  }

  const imageIdValues = Array.from(
    new Set(
      rows
        .map((row) => row.image_id)
        .filter((value): value is PrimitiveId => value !== null && value !== undefined)
        .map((value) => String(value)),
    ),
  );

  const imageUrlById = new Map<string, string>();

  if (!errorMessage && imageIdValues.length > 0) {
    const imagesQuery = await supabase.from("images").select("id, url").in("id", imageIdValues).limit(1000);

    if (imagesQuery.error) {
      errorMessage = `Captions loaded, but image previews failed: ${imagesQuery.error.message}`;
    } else {
      for (const image of (imagesQuery.data ?? []) as ImageLookupRow[]) {
        if (image.id !== null && image.id !== undefined && image.url) {
          imageUrlById.set(String(image.id), image.url);
        }
      }
    }
  }

  const visibleRows = rows.filter((row) => {
    if (visibility === "public") return row.is_public === true;
    if (visibility === "private") return row.is_public !== true;
    return true;
  });

  const filteredRows = visibleRows.filter((row) => {
    if (!search) return true;
    const content = String(row.content ?? "").toLowerCase();
    const imageId = String(row.image_id ?? "").toLowerCase();
    const profileId = String(row.profile_id ?? "").toLowerCase();
    return content.includes(search) || imageId.includes(search) || profileId.includes(search);
  });

  const totalCaptions = rows.length;
  const publicCaptions = rows.filter((row) => row.is_public === true).length;
  const privateCaptions = rows.filter((row) => row.is_public !== true).length;
  const totalLikes = rows.reduce((sum, row) => sum + (row.like_count ?? 0), 0);

  return (
    <section className="space-y-6">
      <div className={ADMIN_PAGE_HEADER}>
        <h2 className={ADMIN_PAGE_TITLE}>Captions</h2>
        <p className={ADMIN_PAGE_SUBTITLE}>Moderate caption records with linked image previews.</p>
      </div>

      <form className={ADMIN_PANEL}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-300">Search content, image ID, or profile ID</span>
            <input
              type="text"
              name="search"
              defaultValue={readQueryValue(params.search)}
              placeholder="Type to filter captions"
              className={ADMIN_INPUT}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-300">Visibility</span>
            <select name="visibility" defaultValue={visibility} className={ADMIN_SELECT}>
              <option value="all">All</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="submit" className={ADMIN_PRIMARY_BUTTON}>
            Apply Filters
          </button>
          <a href="/admin/captions" className={ADMIN_SECONDARY_BUTTON}>
            Reset
          </a>
        </div>
      </form>

      {errorMessage ? (
        <p className={ADMIN_ALERT_ERROR}>Failed to load captions: {errorMessage}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard title="Total Captions" value={totalCaptions.toLocaleString()} />
        <StatCard title="Public Captions" value={publicCaptions.toLocaleString()} />
        <StatCard title="Private Captions" value={privateCaptions.toLocaleString()} />
        <StatCard title="Total Likes" value={totalLikes.toLocaleString()} />
      </div>

      <div className={ADMIN_TABLE_WRAPPER}>
        <table className="min-w-full text-left text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              <th className="px-4 py-3.5 font-semibold">Image Preview</th>
              <th className="px-4 py-3.5 font-semibold">Content</th>
              <th className="px-4 py-3.5 font-semibold">Image ID</th>
              <th className="px-4 py-3.5 font-semibold">Profile ID</th>
              <th className="px-4 py-3.5 font-semibold">Likes</th>
              <th className="px-4 py-3.5 font-semibold">Public</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const rowKey = `${String(row.image_id ?? "none")}-${String(row.profile_id ?? "none")}-${index}`;
              const previewUrl = row.image_id != null ? imageUrlById.get(String(row.image_id)) ?? null : null;

              return (
                <tr
                  key={rowKey}
                  className={`align-top transition-colors duration-150 hover:bg-slate-800/70 ${
                    index % 2 === 0 ? "bg-slate-900/30" : "bg-slate-900/60"
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <ImageThumbnail
                      url={previewUrl}
                      alt={row.content?.slice(0, 40) || "Caption image"}
                      className="h-14 w-14"
                      fallbackLabel="No preview"
                    />
                  </td>
                  <td className="max-w-xl whitespace-pre-wrap break-words px-4 py-3.5 text-slate-200">
                    {row.content && row.content.trim() !== "" ? row.content : "-"}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-4 py-3.5 font-mono text-xs text-slate-300"
                    title={String(row.image_id ?? "-")}
                  >
                    {row.image_id != null ? String(row.image_id) : "-"}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3.5 font-mono text-xs text-slate-300" title={row.profile_id ?? "-"}>
                    {row.profile_id ?? "-"}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full border border-fuchsia-400/35 bg-fuchsia-950/45 px-2.5 py-1 text-xs font-semibold text-fuchsia-200">
                      {row.like_count ?? 0} likes
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {row.is_public === true ? (
                      <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-600/60 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300">
                        Private
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {!errorMessage && filteredRows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={6}>
                  No captions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
