import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImageThumbnail } from "@/components/admin/image-thumbnail";
import { ADMIN_ALERT_ERROR, ADMIN_PAGE_HEADER, ADMIN_PAGE_SUBTITLE, ADMIN_PAGE_TITLE, ADMIN_STAT_CARD } from "@/components/admin/theme";
import { AdminPageShell } from "@/components/admin/ui";

const PAGE_SIZE = 1000;

type ProfileLite = {
  id?: string | null;
  is_superadmin?: boolean | null;
};

type CaptionLite = {
  id?: string | null;
  image_id?: string | null;
  content?: string | null;
};

type VoteLite = {
  caption_id?: string | null;
  user_id?: string | null;
};

type ImageLite = {
  id?: string | null;
  url?: string | null;
};

type QueryRowsResult<T> = {
  rows: T[];
  usedColumns?: string;
  error?: string;
};

function fmtInt(value: number | null): string {
  return value === null ? "N/A" : value.toLocaleString();
}

function fmtAvg(value: number | null): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return "N/A";
  return value.toFixed(2);
}

function pct(part: number | null, total: number | null): number | null {
  if (part === null || total === null || total === 0) return null;
  return (part / total) * 100;
}

async function fetchCount(table: string): Promise<{ count: number | null; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase.from(table).select("*", { head: true, count: "exact" });
  if (error) {
    return { count: null, error: `${table}: ${error.message}` };
  }
  return { count: count ?? 0 };
}

async function fetchAllRowsWithFallback<T>(table: string, columnOptions: string[]): Promise<QueryRowsResult<T>> {
  const supabase = await createSupabaseServerClient();
  let lastError = "";

  for (const columns of columnOptions) {
    const rows: T[] = [];
    let offset = 0;
    let failed = false;

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        lastError = `${table} (${columns}): ${error.message}`;
        failed = true;
        break;
      }

      const batch = (data ?? []) as T[];
      rows.push(...batch);

      if (batch.length < PAGE_SIZE) {
        return { rows, usedColumns: columns };
      }

      offset += PAGE_SIZE;
    }

    if (!failed) {
      return { rows, usedColumns: columns };
    }
  }

  return { rows: [], error: lastError || `Failed to query ${table}` };
}

async function fetchImagesByIds(ids: string[]): Promise<{ map: Map<string, string | null>; error?: string }> {
  if (ids.length === 0) {
    return { map: new Map() };
  }

  const supabase = await createSupabaseServerClient();
  const columnsToTry = ["id, url", "id"];
  let lastError = "";

  for (const columns of columnsToTry) {
    const { data, error } = await supabase.from("images").select(columns).in("id", ids);
    if (error) {
      lastError = `images (${columns}): ${error.message}`;
      continue;
    }

    const map = new Map<string, string | null>();
    for (const row of (data ?? []) as ImageLite[]) {
      if (row.id) {
        map.set(row.id, row.url ?? null);
      }
    }
    return { map };
  }

  return { map: new Map(), error: lastError || "Failed to query images" };
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
  glowClass,
}: {
  icon: string;
  label: string;
  value: string;
  note?: string;
  glowClass?: string;
}) {
  return (
    <div
      className={`group ${ADMIN_STAT_CARD} ${glowClass ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <span className="text-lg leading-none transition-transform duration-200 group-hover:scale-110">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [profilesCountRes, imagesCountRes, captionsCountRes, votesCountRes, superadminsCountRes] = await Promise.all([
    fetchCount("profiles"),
    fetchCount("images"),
    fetchCount("captions"),
    fetchCount("caption_votes"),
    (async () => {
      const supabase = await createSupabaseServerClient();
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { head: true, count: "exact" })
        .eq("is_superadmin", true);
      if (error) return { count: null as number | null, error: `profiles.is_superadmin: ${error.message}` };
      return { count: count ?? 0, error: undefined };
    })(),
  ]);

  const [profilesRowsRes, captionsRowsRes, votesRowsRes] = await Promise.all([
    fetchAllRowsWithFallback<ProfileLite>("profiles", ["id, is_superadmin", "id"]),
    fetchAllRowsWithFallback<CaptionLite>("captions", ["id, image_id, content", "id, image_id", "id, content", "id"]),
    fetchAllRowsWithFallback<VoteLite>("caption_votes", ["caption_id, user_id", "caption_id"]),
  ]);

  const issues: string[] = [];
  for (const candidate of [
    profilesCountRes.error,
    imagesCountRes.error,
    captionsCountRes.error,
    votesCountRes.error,
    superadminsCountRes.error,
    profilesRowsRes.error,
    captionsRowsRes.error,
    votesRowsRes.error,
  ]) {
    if (candidate) issues.push(candidate);
  }

  const profilesRows = profilesRowsRes.rows;
  const captionsRows = captionsRowsRes.rows;
  const votesRows = votesRowsRes.rows;

  const totalProfiles = profilesCountRes.count;
  const totalImages = imagesCountRes.count;
  const totalCaptions = captionsCountRes.count;
  const totalVotes = votesCountRes.count;

  const derivedSuperadmins = profilesRows.reduce((acc, row) => (row.is_superadmin === true ? acc + 1 : acc), 0);
  const superadmins = superadminsCountRes.count ?? (profilesRowsRes.usedColumns?.includes("is_superadmin") ? derivedSuperadmins : null);
  const nonSuperadmins =
    totalProfiles !== null && superadmins !== null
      ? Math.max(totalProfiles - superadmins, 0)
      : profilesRowsRes.usedColumns?.includes("is_superadmin")
        ? profilesRows.length - derivedSuperadmins
        : null;

  const avgCaptionsPerImage =
    totalCaptions !== null && totalImages !== null && totalImages > 0 ? totalCaptions / totalImages : null;
  const avgVotesPerCaption =
    totalVotes !== null && totalCaptions !== null && totalCaptions > 0 ? totalVotes / totalCaptions : null;

  const captionById = new Map<string, CaptionLite>();
  const captionCountsByImageId = new Map<string, number>();
  const starterBuckets = [
    { key: "me when", label: "me when", count: 0 },
    { key: "when", label: "when", count: 0 },
    { key: "pov", label: "POV", count: 0 },
    { key: "bro when", label: "bro when", count: 0 },
    { key: "that feeling when", label: "that feeling when", count: 0 },
  ];
  let otherStarterCount = 0;

  for (const caption of captionsRows) {
    if (caption.id) {
      captionById.set(caption.id, caption);
    }
    if (caption.image_id) {
      captionCountsByImageId.set(caption.image_id, (captionCountsByImageId.get(caption.image_id) ?? 0) + 1);
    }

    const normalized = (caption.content ?? "").trimStart().toLowerCase();
    let matched = false;
    for (const bucket of starterBuckets) {
      if (normalized.startsWith(bucket.key)) {
        bucket.count += 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      otherStarterCount += 1;
    }
  }

  const trendRows = [...starterBuckets, { key: "other", label: "Other", count: otherStarterCount }].sort(
    (a, b) => b.count - a.count,
  );
  const trendTotal = trendRows.reduce((acc, row) => acc + row.count, 0);

  const voteCountsByCaptionId = new Map<string, number>();
  const uniqueVoters = new Set<string>();
  for (const vote of votesRows) {
    if (vote.caption_id) {
      voteCountsByCaptionId.set(vote.caption_id, (voteCountsByCaptionId.get(vote.caption_id) ?? 0) + 1);
    }
    if (vote.user_id) {
      uniqueVoters.add(vote.user_id);
    }
  }

  const leaderboardBase = [...voteCountsByCaptionId.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([captionId, voteCount], index) => {
      const caption = captionById.get(captionId);
      return {
        rank: index + 1,
        captionId,
        voteCount,
        captionText: caption?.content?.trim() || "(caption text unavailable)",
        imageId: caption?.image_id || null,
      };
    });

  const mostCaptionedImages = [...captionCountsByImageId.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([imageId, captionCount], index) => ({ rank: index + 1, imageId, captionCount }));

  const leaderboardImageIds = leaderboardBase.map((row) => row.imageId).filter((id): id is string => Boolean(id));
  const topImageIds = mostCaptionedImages.map((row) => row.imageId);
  const imageIdsToLookup = [...new Set([...leaderboardImageIds, ...topImageIds])];
  const imageLookupRes = await fetchImagesByIds(imageIdsToLookup);
  if (imageLookupRes.error) issues.push(imageLookupRes.error);
  const imageUrlById = imageLookupRes.map;

  const leaderboard = leaderboardBase.map((row) => ({
    ...row,
    imageUrl: row.imageId ? (imageUrlById.get(row.imageId) ?? null) : null,
    imageIdDisplay: row.imageId ?? "-",
  }));

  const topImage = mostCaptionedImages[0];
  const topCaption = leaderboard[0];
  const superadminPercent = pct(superadmins, totalProfiles);
  const superadminBar = superadminPercent ?? 0;
  const nonSuperadminBar = superadminPercent !== null ? 100 - superadminPercent : 0;

  const statCards = [
    {
      label: "Total Profiles",
      value: fmtInt(totalProfiles),
      icon: "🧑‍🤝‍🧑",
      note: "All user profile records",
      glowClass: "",
    },
    {
      label: "Total Images",
      value: fmtInt(totalImages),
      icon: "🖼️",
      note: "Meme canvas inventory",
      glowClass: "",
    },
    {
      label: "Total Captions",
      value: fmtInt(totalCaptions),
      icon: "✍️",
      note: "Written punchlines so far",
      glowClass: "",
    },
    {
      label: "Total Votes Cast",
      value: fmtInt(totalVotes),
      icon: "🗳️",
      note: "Community reactions logged",
      glowClass: "",
    },
    {
      label: "Superadmins",
      value: fmtInt(superadmins),
      icon: "🛡️",
      note: "Accounts with elevated access",
      glowClass: "",
    },
    {
      label: "Non-superadmins",
      value: fmtInt(nonSuperadmins),
      icon: "👥",
      note: "Everyone else",
      glowClass: "",
    },
    {
      label: "Avg Captions / Image",
      value: fmtAvg(avgCaptionsPerImage),
      icon: "📈",
      note: "Caption density ratio",
      glowClass: "",
    },
    {
      label: "Avg Votes / Caption",
      value: fmtAvg(avgVotesPerCaption),
      icon: "🎯",
      note: "Vote intensity score",
      glowClass: "",
    },
  ];

  return (
    <AdminPageShell className="space-y-6">
      <header className={ADMIN_PAGE_HEADER}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Admin Dashboard</p>
        <h1 className={ADMIN_PAGE_TITLE}>System Overview</h1>
        <p className={`${ADMIN_PAGE_SUBTITLE} max-w-2xl`}>
          A playful command center for profiles, image activity, caption trends, and voting energy.
        </p>
        <p className="mt-3 text-xs text-slate-400">Last updated: just now</p>
      </header>

      {issues.length > 0 ? (
        <div className={ADMIN_ALERT_ERROR}>
          Some metrics were partially unavailable. The dashboard is showing everything that could be computed.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            note={card.note}
            glowClass={card.glowClass}
          />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Section
            title="Funniest Caption Leaderboard"
            subtitle="Top 10 captions ranked by vote count."
            action={
              <span className="rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">
                {leaderboard.length} ranked
              </span>
            }
          >
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-400">No vote data yet for leaderboard ranking.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((row) => {
                  const trophy = row.rank === 1 ? "🏆" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `${row.rank}.`;
                  return (
                    <div
                      key={`${row.captionId}-${row.rank}`}
                      className={`grid grid-cols-[56px_56px_1fr_auto] items-center gap-3 rounded-xl border p-3 transition-all duration-200 ${
                        row.rank === 1
                          ? "border-amber-300/60 bg-amber-500/10 shadow-lg shadow-amber-400/25"
                        : row.rank === 2
                            ? "border-slate-300/60 bg-slate-400/10 shadow-lg shadow-slate-300/20"
                            : row.rank === 3
                              ? "border-orange-400/60 bg-orange-500/10 shadow-lg shadow-orange-400/20"
                              : "border-slate-700/40 bg-slate-800/40"
                      }`}
                    >
                      <div className="text-center text-sm font-semibold text-slate-200">{trophy}</div>
                      <ImageThumbnail
                        url={row.imageUrl}
                        alt={`Image preview for ranked caption ${row.rank}`}
                        className="h-12 w-12"
                        fallbackLabel="No image"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{row.captionText}</p>
                        <p className="mt-1 text-xs text-slate-400">image_id: {row.imageIdDisplay}</p>
                      </div>
                      <div className="rounded-full border border-cyan-300/40 bg-[linear-gradient(135deg,rgba(34,211,238,0.25),rgba(59,130,246,0.25))] px-3 py-1 text-xs font-semibold text-cyan-100 shadow-lg shadow-cyan-400/30">
                        {row.voteCount} votes
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section
            title="Caption Starter Trends"
            subtitle="Which caption openers are dominating the feed."
            action={
              <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">
                {fmtInt(captionsRows.length)} scanned
              </span>
            }
          >
            <div className="space-y-3">
              {trendRows.map((row) => {
                const percentage = trendTotal > 0 ? (row.count / trendTotal) * 100 : 0;
                return (
                  <div key={row.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{row.label}</span>
                      <span className="text-slate-400">
                        {row.count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Section title="Most Captioned Images" subtitle="Top images by caption count.">
            {mostCaptionedImages.length === 0 ? (
              <p className="text-sm text-slate-400">No caption-to-image relationships available yet.</p>
            ) : (
              <div className="space-y-2">
                {mostCaptionedImages.slice(0, 5).map((row) => {
                  const preview = imageUrlById.get(row.imageId) ?? null;
                  return (
                    <div
                      key={row.imageId}
                      className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-800/40 p-2.5 transition-all duration-200"
                    >
                      <div className="w-6 text-center text-xs font-semibold text-blue-300">#{row.rank}</div>
                      <ImageThumbnail url={preview} alt={`Image ${row.imageId}`} className="h-10 w-10" fallbackLabel="N/A" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-slate-300">{row.imageId}</p>
                        <p className="text-xs text-slate-400">{row.captionCount} captions</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section title="User Breakdown" subtitle="Superadmin vs non-superadmin distribution.">
            <div className="space-y-3">
              <div className="h-4 overflow-hidden rounded-full bg-slate-800">
                <div className="flex h-full">
                  <div className="bg-cyan-400" style={{ width: `${superadminBar}%` }} />
                  <div className="bg-violet-500" style={{ width: `${nonSuperadminBar}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
                  <p className="text-cyan-200">Superadmins</p>
                  <p className="text-lg font-semibold text-slate-100">{fmtInt(superadmins)}</p>
                </div>
                <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3">
                  <p className="text-violet-200">Non-superadmins</p>
                  <p className="text-lg font-semibold text-slate-100">{fmtInt(nonSuperadmins)}</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Quick Snapshot" subtitle="Fast admin trivia from live system data.">
            <div className="space-y-2 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Most captioned image</p>
                <p className="mt-1 font-mono text-xs text-slate-200">{topImage?.imageId ?? "N/A"}</p>
                <p className="mt-1 text-xs text-slate-400">{topImage ? `${topImage.captionCount} captions` : "No data"}</p>
              </div>
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Caption with most votes</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-100">{topCaption?.captionText ?? "N/A"}</p>
                <p className="mt-1 text-xs text-slate-400">{topCaption ? `${topCaption.voteCount} votes` : "No data"}</p>
              </div>
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Unique users who voted</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{fmtInt(votesRowsRes.usedColumns?.includes("user_id") ? uniqueVoters.size : null)}</p>
              </div>
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Profiles that are superadmins</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">
                  {superadminPercent === null ? "N/A" : `${superadminPercent.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </AdminPageShell>
  );
}
