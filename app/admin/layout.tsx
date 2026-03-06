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
    <div className="min-h-screen bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-slate-200">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-6 px-4 py-4 md:grid-cols-[260px_1fr] md:px-6 md:py-6">
        <aside className="sticky top-4 h-fit rounded-3xl border border-slate-500/20 bg-[rgba(15,23,42,0.72)] p-6 shadow-lg shadow-cyan-500/10 backdrop-blur-md transition-all duration-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Admin Panel</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-wide text-slate-100">Humor HQ</h1>
            <p className="mt-2 text-sm text-slate-400">Monitor content, trends, and moderation at a glance.</p>
          </div>
          <AdminSidebarNav />
        </aside>

        <main className="rounded-3xl border border-slate-500/20 bg-[rgba(15,23,42,0.7)] p-5 shadow-xl shadow-cyan-500/10 backdrop-blur-md transition-all duration-200 md:p-7">
          {children}
        </main>
      </div>
      <AccountWidget email={user.email} />
    </div>
  );
}
