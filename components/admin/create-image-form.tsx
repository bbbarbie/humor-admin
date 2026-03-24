"use client";

import { useMemo, useRef, useState } from "react";
import {
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SECONDARY_BUTTON,
} from "@/components/admin/theme";

type CreateMode = "url" | "upload";

type CreateImageFormProps = {
  isBusy: boolean;
  onCreateFromUrl: (url: string) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
};

export function CreateImageForm({
  isBusy,
  onCreateFromUrl,
  onUploadFile,
}: CreateImageFormProps) {
  const [mode, setMode] = useState<CreateMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTabClasses = useMemo(
    () =>
      ADMIN_PRIMARY_BUTTON.replace("px-4 py-2 text-sm", "px-3 py-2 text-xs"),
    [],
  );
  const inactiveTabClasses = useMemo(
    () => ADMIN_SECONDARY_BUTTON.replace("px-4 py-2 text-sm", "px-3 py-2 text-xs"),
    [],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "url") {
      const trimmed = url.trim();
      if (!trimmed) return;
      await onCreateFromUrl(trimmed);
      setUrl("");
      return;
    }

    if (mode === "upload") {
      if (!file) return;
      await onUploadFile(file);
      setFile(null);

      const input = fileInputRef.current;
      if (input) {
        input.value = "";
      }
      return;
    }
  }

  const isSubmitDisabled =
    isBusy ||
    (mode === "url" && !url.trim()) ||
    (mode === "upload" && !file);

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-5 space-y-4 ${ADMIN_PANEL}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={mode === "url" ? activeTabClasses : inactiveTabClasses}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={mode === "upload" ? activeTabClasses : inactiveTabClasses}
        >
          Upload
        </button>
      </div>

      {mode === "url" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Image URL</span>
          <input
            type="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/image.jpg"
            className={ADMIN_INPUT.replace("py-2.5", "py-2")}
          />
        </label>
      ) : null}

      {mode === "upload" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Image File</span>
          <input
            id="create-image-file"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-violet-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <p className="text-xs text-slate-400">
            Uploads use Supabase Storage bucket <code>images</code>.
          </p>
        </label>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={ADMIN_PRIMARY_BUTTON.replace("py-2", "py-2.5")}
        >
          {isBusy ? "Saving..." : mode === "url" ? "Create From URL" : "Create From Upload"}
        </button>
      </div>
    </form>
  );
}
