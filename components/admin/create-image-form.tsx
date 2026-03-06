"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SELECT,
} from "@/components/admin/theme";

type CreateMode = "url" | "upload" | "generate";

export type GeneratedImageCandidate = {
  id: string;
  url: string;
};

export type GenerateImageInput = {
  prompt: string;
  size: "1024x1024" | "1024x1536" | "1536x1024";
  count: 1 | 2 | 3 | 4;
};

type CreateImageFormProps = {
  isBusy: boolean;
  isGenerating: boolean;
  onCreateFromUrl: (url: string) => Promise<void>;
  onUploadFile: (file: File) => Promise<void>;
  onGenerateImages: (input: GenerateImageInput) => Promise<GeneratedImageCandidate[]>;
  onCreateFromGenerated: (url: string) => Promise<void>;
};

export function CreateImageForm({
  isBusy,
  isGenerating,
  onCreateFromUrl,
  onUploadFile,
  onGenerateImages,
  onCreateFromGenerated,
}: CreateImageFormProps) {
  const [mode, setMode] = useState<CreateMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<GenerateImageInput["size"]>("1024x1024");
  const [count, setCount] = useState<GenerateImageInput["count"]>(2);
  const [candidates, setCandidates] = useState<GeneratedImageCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

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

      const input = document.getElementById("create-image-file") as HTMLInputElement | null;
      if (input) {
        input.value = "";
      }
      return;
    }

    if (mode === "generate") {
      const selected = candidates.find((candidate) => candidate.id === selectedCandidateId);
      if (!selected) return;
      await onCreateFromGenerated(selected.url);
      setCandidates([]);
      setSelectedCandidateId(null);
    }
  }

  async function handleGenerateCandidates() {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const generated = await onGenerateImages({
      prompt: trimmed,
      size,
      count,
    });

    setCandidates(generated);
    setSelectedCandidateId(generated[0]?.id ?? null);
  }

  const isSubmitDisabled =
    isBusy ||
    (mode === "url" && !url.trim()) ||
    (mode === "upload" && !file) ||
    (mode === "generate" && !selectedCandidateId);

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
        <button
          type="button"
          onClick={() => setMode("generate")}
          className={mode === "generate" ? activeTabClasses : inactiveTabClasses}
        >
          Generate
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

      {mode === "generate" ? (
        <div className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-950/55 p-3.5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-300">Prompt / Description</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="A photorealistic golden retriever in a business suit, office background, comedic tone"
              rows={3}
              className={ADMIN_INPUT.replace("py-2.5", "py-2")}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Size</span>
              <select
                value={size}
                onChange={(event) => setSize(event.target.value as GenerateImageInput["size"])}
                className={ADMIN_SELECT.replace("w-full ", "").replace("px-3 py-2.5", "px-2.5 py-2")}
              >
                <option value="1024x1024">1024 x 1024</option>
                <option value="1024x1536">1024 x 1536</option>
                <option value="1536x1024">1536 x 1024</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Candidates</span>
              <select
                value={count}
                onChange={(event) => setCount(Number(event.target.value) as GenerateImageInput["count"])}
                className={ADMIN_SELECT.replace("w-full ", "").replace("px-3 py-2.5", "px-2.5 py-2")}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
            <button
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={() => void handleGenerateCandidates()}
              className={ADMIN_SECONDARY_BUTTON.replace("px-4 py-2 text-sm", "px-3 py-2 text-xs")}
            >
              {isGenerating ? "Generating..." : "Generate Candidates"}
            </button>
          </div>

          {candidates.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Generated Previews</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {candidates.map((candidate, index) => {
                  const isSelected = selectedCandidateId === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className={`overflow-hidden rounded-xl transition-all duration-200 ${
                        isSelected
                          ? "border-2 border-blue-400 shadow-md shadow-blue-500/30"
                          : "border border-slate-700/50 hover:-translate-y-0.5 hover:border-blue-400/40"
                      }`}
                      aria-label={`Select generated image ${index + 1}`}
                    >
                      <Image
                        src={candidate.url}
                        alt={`Generated candidate ${index + 1}`}
                        width={320}
                        height={224}
                        unoptimized
                        className="h-28 w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Generate images, then select one to create an image record.</p>
          )}
        </div>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={ADMIN_PRIMARY_BUTTON.replace("py-2", "py-2.5")}
        >
          {isBusy
            ? "Saving..."
            : mode === "url"
              ? "Create From URL"
              : mode === "upload"
                ? "Create From Upload"
                : "Use Selected Generated Image"}
        </button>
      </div>
    </form>
  );
}
