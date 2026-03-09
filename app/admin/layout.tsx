import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountWidget } from "@/components/admin/account-widget";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_superadmin !== true) {
    redirect("/forbidden");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_45%),linear-gradient(135deg,#020617,#0f172a_52%,#111827)] text-slate-200">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 md:grid-cols-[260px_1fr] md:px-6 md:py-6">
        <aside className="h-screen overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30 backdrop-blur-md md:sticky md:top-0">
          <div className="flex h-full min-h-0 flex-col">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Admin Panel</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">Humor HQ</h1>
              <p className="mt-2 text-sm text-slate-400">Monitor content, trends, and moderation at a glance.</p>
            </div>
            <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              <AdminSidebarNav />
            </div>
            <div className="mt-4 shrink-0 border-t border-slate-700/40 pt-4">
              <AccountWidget email={user.email} />
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
