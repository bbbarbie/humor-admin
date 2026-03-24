import Link from "next/link";
import { createImageAction } from "../actions";

export default function NewImagePage() {
  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Add Image</h2>
        <p className="text-sm text-zinc-600">Insert a new image row.</p>
      </div>

      <form action={createImageAction} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">url</span>
          <input
            name="url"
            type="url"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white">
            Create
          </button>
          <Link href="/admin/images" className="text-sm underline">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
