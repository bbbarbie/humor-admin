import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteImageAction, updateImageAction } from "../actions";

export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: image, error } = await supabase
    .from("images")
    .select("id, url, created_datetime_utc")
    .eq("id", id)
    .maybeSingle();

  if (error || !image) {
    notFound();
  }

  const boundUpdateAction = updateImageAction.bind(null, id);

  return (
    <section className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Image</h2>
        <Link href="/admin/images" className="text-sm underline">
          Back to list
        </Link>
      </div>

      <form action={boundUpdateAction} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">url</span>
          <input
            name="url"
            type="url"
            required
            defaultValue={image.url ?? ""}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Save changes
          </button>
        </div>
      </form>

      <form action={deleteImageAction}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="text-sm text-red-700 underline">
          Delete image
        </button>
      </form>

      <p className="text-xs text-zinc-500">Created: {image.created_datetime_utc ?? "-"}</p>
    </section>
  );
}
