import { notFound } from "next/navigation";
import { AdminResourceClient } from "@/components/admin/admin-resource-client";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/ui";
import { ADMIN_RESOURCE_CONFIGS } from "@/lib/admin/resources";

export function AdminResourcePage({ slug }: { slug: string }) {
  const config = ADMIN_RESOURCE_CONFIGS[slug];
  if (!config) notFound();

  return (
    <AdminPageShell>
      <AdminPageHeader title={config.title} subtitle={config.subtitle} />

      <AdminResourceClient resourceSlug={config.slug} mode={config.mode} ui={config.ui} />
    </AdminPageShell>
  );
}
