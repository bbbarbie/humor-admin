import { createSupabaseServerClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  is_superadmin: boolean | null;
  created_at?: string | null;
};

export default async function AdminProfilesPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, is_superadmin, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Profile[];

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Profiles (Read-only)</h2>
      {error ? (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load profiles: {error.message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">is_superadmin</th>
              <th className="px-4 py-3 font-medium">created_at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100">
                <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                <td className="px-4 py-3">{String(Boolean(row.is_superadmin))}</td>
                <td className="px-4 py-3">{row.created_at ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
