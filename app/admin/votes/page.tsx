import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatUtc } from "@/lib/format-utc";
import {
  ADMIN_ALERT_ERROR,
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_TABLE_HEAD,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_WRAPPER,
} from "@/components/admin/theme";
import { AdminPageHeader, AdminPageShell, AdminStatCard } from "@/components/admin/ui";

type GenericRow = Record<string, unknown>;

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "-";
  return formatUtc(value);
}

function statValue(value: number | null): string {
  return value === null ? "-" : value.toLocaleString();
}

export default async function AdminVotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = readQueryValue(params.search).trim().toLowerCase();

  const supabase = await createSupabaseServerClient();

  const orderColumns = ["created_datetime_utc", "created_at"] as const;
  let data: GenericRow[] | null = null;
  let errorMessage: string | null = null;

  for (const column of orderColumns) {
    const query = await supabase.from("caption_votes").select("*").order(column, { ascending: false }).limit(1000);
    if (!query.error) {
      data = (query.data ?? []) as GenericRow[];
      errorMessage = null;
      break;
    }

    errorMessage = query.error.message;
  }

  if (!data) {
    const fallback = await supabase.from("caption_votes").select("*").limit(1000);
    if (fallback.error) {
      errorMessage = fallback.error.message;
      data = [];
    } else {
      data = (fallback.data ?? []) as GenericRow[];
      errorMessage = null;
    }
  }

  const keySet = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      keySet.add(key);
    }
  }

  const createdField = keySet.has("created_datetime_utc")
    ? "created_datetime_utc"
    : keySet.has("created_at")
      ? "created_at"
      : null;
  const voteValueField = ["vote", "value", "direction"].find((field) => keySet.has(field)) ?? null;

  const filteredRows = data.filter((row) => {
    if (!search) return true;

    const userId = row.user_id !== undefined && row.user_id !== null ? String(row.user_id).toLowerCase() : "";
    const captionId = row.caption_id !== undefined && row.caption_id !== null ? String(row.caption_id).toLowerCase() : "";

    return userId.includes(search) || captionId.includes(search);
  });

  const totalVotes = filteredRows.length;
  const uniqueVoters = keySet.has("user_id")
    ? new Set(
        filteredRows
          .map((row) => (row.user_id !== undefined && row.user_id !== null ? String(row.user_id) : ""))
          .filter(Boolean),
      ).size
    : null;
  const uniqueCaptions = keySet.has("caption_id")
    ? new Set(
        filteredRows
          .map((row) => (row.caption_id !== undefined && row.caption_id !== null ? String(row.caption_id) : ""))
          .filter(Boolean),
      ).size
    : null;

  return (
    <AdminPageShell>
      <AdminPageHeader title="Votes" subtitle="Inspect caption voting activity." />

      <form className={ADMIN_PANEL}>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-300">Search by user_id or caption_id</span>
          <input
            type="text"
            name="search"
            defaultValue={readQueryValue(params.search)}
            placeholder="Type a user or caption id"
            className={ADMIN_INPUT}
          />
        </label>

        <div className="mt-3 flex items-center gap-2">
          <button type="submit" className={ADMIN_PRIMARY_BUTTON}>
            Apply Filter
          </button>
          <a href="/admin/votes" className={ADMIN_SECONDARY_BUTTON}>
            Reset
          </a>
        </div>
      </form>

      {errorMessage ? (
        <p className={ADMIN_ALERT_ERROR}>
          Failed to load votes: {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <AdminStatCard title="Total Votes" value={statValue(totalVotes)} />
        <AdminStatCard title="Unique Voters" value={statValue(uniqueVoters)} />
        <AdminStatCard title="Unique Captions Voted On" value={statValue(uniqueCaptions)} />
      </div>

      <div className={ADMIN_TABLE_WRAPPER}>
        <table className="min-w-full text-left text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              <th className="px-4 py-3.5 font-semibold">Vote ID</th>
              <th className="px-4 py-3.5 font-semibold">User ID</th>
              <th className="px-4 py-3.5 font-semibold">Caption ID</th>
              <th className="px-4 py-3.5 font-semibold">Vote Value</th>
              <th className="px-4 py-3.5 font-semibold">Created Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const rowId = row.id !== undefined && row.id !== null ? String(row.id) : `row-${index}`;
              const voteValue = voteValueField ? row[voteValueField] : undefined;
              const createdValue = createdField ? row[createdField] : null;

              return (
                <tr
                  key={rowId}
                  className={`${ADMIN_TABLE_ROW} ${index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}`}
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-300">{row.id ? String(row.id) : "-"}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                    {row.user_id !== undefined && row.user_id !== null ? String(row.user_id) : "-"}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                    {row.caption_id !== undefined && row.caption_id !== null ? String(row.caption_id) : "-"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-200">
                    {voteValue !== undefined && voteValue !== null && String(voteValue).trim() !== "" ? String(voteValue) : "-"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{formatTime(createdValue)}</td>
                </tr>
              );
            })}

            {filteredRows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={5}>
                  No votes found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AdminPageShell>
  );
}
