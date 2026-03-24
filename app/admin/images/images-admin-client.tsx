"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatUtc } from "@/lib/format-utc";
import { CreateImageForm } from "@/components/admin/create-image-form";
import { ImageThumbnail } from "@/components/admin/image-thumbnail";
import {
  ADMIN_DANGER_BUTTON,
  ADMIN_ALERT_ERROR,
  ADMIN_ALERT_SUCCESS,
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_TABLE_ACTION_PRIMARY,
  ADMIN_TABLE_ACTION_SECONDARY,
  ADMIN_TABLE_HEAD,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_WRAPPER,
} from "@/components/admin/theme";

type PrimitiveId = string | number;

const IMAGE_BUCKET = "images";

export type ImageRow = {
  id: PrimitiveId;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
  url: string | null;
};

type ApiSuccess = {
  row?: ImageRow;
  message?: string;
};

type ApiError = {
  error?: string;
};

function truncateUrl(url: string, max = 60): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}...`;
}

function sanitizeFileName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-");
}

export function ImagesAdminClient({ initialRows }: { initialRows: ImageRow[] }) {
  const [rows, setRows] = useState<ImageRow[]>(Array.isArray(initialRows) ? initialRows : []);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState("");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const aTime = a.created_datetime_utc ? new Date(a.created_datetime_utc).getTime() : 0;
        const bTime = b.created_datetime_utc ? new Date(b.created_datetime_utc).getTime() : 0;
        return bTime - aTime;
      }),
    [rows],
  );

  async function parseResponse(response: Response): Promise<ApiSuccess> {
    const json = (await response.json().catch(() => ({}))) as ApiSuccess & ApiError;
    if (!response.ok) {
      throw new Error(json.error ?? "Request failed");
    }
    return json;
  }

  function normalizeRow(row: ImageRow): ImageRow {
    return {
      id: row.id,
      created_datetime_utc: row.created_datetime_utc ?? null,
      modified_datetime_utc: row.modified_datetime_utc ?? null,
      url: row.url ?? "",
    };
  }

  async function createImageByUrl(url: string) {
    const response = await fetch("/api/admin/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const result = await parseResponse(response);

    if (result.row) {
      const nextRow = normalizeRow(result.row);
      setRows((current) => [nextRow, ...current.filter((row) => String(row.id) !== String(nextRow.id))]);
    }

    setMessage(result.message ?? "Image created.");
  }

  async function handleCreateFromUrl(url: string) {
    setMessage(null);
    setErrorMessage(null);

    try {
      setLoadingActionId("create");
      await createImageByUrl(url);
      setIsCreating(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create image.");
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleUploadFile(file: File) {
    setMessage(null);
    setErrorMessage(null);

    try {
      setLoadingActionId("create");

      const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
      const fileName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name.replace(/\.[^.]+$/, ""))}.${extension}`;
      const path = `admin-uploads/${fileName}`;
      const supabase = createSupabaseBrowserClient();

      const upload = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

      if (upload.error) {
        throw new Error(
          `Upload failed: ${upload.error.message}. Ensure Supabase Storage bucket "${IMAGE_BUCKET}" exists and is configured.`,
        );
      }

      const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      if (!publicUrl) {
        throw new Error(`Upload succeeded but no public URL was returned for bucket "${IMAGE_BUCKET}".`);
      }

      await createImageByUrl(publicUrl);
      setIsCreating(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleSaveEdit(id: PrimitiveId) {
    setMessage(null);
    setErrorMessage(null);

    const trimmed = editingUrl.trim();
    if (!trimmed) {
      setErrorMessage("Image URL is required.");
      return;
    }

    try {
      setLoadingActionId(`edit-${String(id)}`);
      const response = await fetch(`/api/admin/images/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const result = await parseResponse(response);

      if (result.row) {
        const updated = normalizeRow(result.row);
        setRows((current) => current.map((row) => (String(row.id) === String(updated.id) ? updated : row)));
      }

      setEditingId(null);
      setEditingUrl("");
      setMessage(result.message ?? "Image updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update image.");
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleDelete(id: PrimitiveId) {
    const shouldDelete = window.confirm("Delete this image record?");
    if (!shouldDelete) return;

    setMessage(null);
    setErrorMessage(null);

    try {
      setLoadingActionId(`delete-${String(id)}`);
      const response = await fetch(`/api/admin/images/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      const result = await parseResponse(response);

      setRows((current) => current.filter((row) => String(row.id) !== String(id)));
      setMessage(result.message ?? "Image deleted.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete image.");
    } finally {
      setLoadingActionId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className={ADMIN_ALERT_SUCCESS}>{message}</p>
      ) : null}
      {errorMessage ? (
        <p className={ADMIN_ALERT_ERROR}>{errorMessage}</p>
      ) : null}

      <div className={ADMIN_PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Create Image</h3>
            <p className="mt-1 text-sm text-slate-400">Choose URL or upload.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCreating((v) => !v);
              setErrorMessage(null);
            }}
            className={ADMIN_PRIMARY_BUTTON}
          >
            {isCreating ? "Close" : "New Image"}
          </button>
        </div>

        {isCreating ? (
          <CreateImageForm
            isBusy={loadingActionId === "create"}
            onCreateFromUrl={handleCreateFromUrl}
            onUploadFile={handleUploadFile}
          />
        ) : null}
      </div>

      <div className={ADMIN_TABLE_WRAPPER}>
        <table className="min-w-full text-left text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              <th className="px-4 py-3.5 font-semibold">Preview</th>
              <th className="px-4 py-3.5 font-semibold">ID</th>
              <th className="px-4 py-3.5 font-semibold">URL</th>
              <th className="px-4 py-3.5 font-semibold">Created UTC</th>
              <th className="px-4 py-3.5 font-semibold">Modified UTC</th>
              <th className="px-4 py-3.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => {
              const rowId = String(row.id);
              const isEditing = editingId === rowId;
              const isSavingRow = loadingActionId === `edit-${rowId}`;
              const isDeletingRow = loadingActionId === `delete-${rowId}`;

              return (
                <tr
                  key={rowId}
                  className={`${ADMIN_TABLE_ROW} ${index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}`}
                >
                  <td className="px-4 py-3.5">
                    <ImageThumbnail url={row.url} alt={`Image ${rowId}`} className="h-14 w-14" />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-300">{rowId}</td>
                  <td className="max-w-[320px] px-4 py-3.5">
                    {isEditing ? (
                      <input
                        type="url"
                        value={editingUrl}
                        onChange={(event) => setEditingUrl(event.target.value)}
                        className={ADMIN_INPUT.replace("px-3 py-2.5", "px-2.5 py-1.5")}
                      />
                    ) : row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-slate-200 underline decoration-slate-500 underline-offset-2 hover:text-blue-300"
                        title={row.url}
                      >
                        {truncateUrl(row.url)}
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300">{formatUtc(row.created_datetime_utc)}</td>
                  <td className="px-4 py-3.5 text-slate-300">{formatUtc(row.modified_datetime_utc)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleSaveEdit(row.id)}
                            disabled={isSavingRow}
                            className={ADMIN_TABLE_ACTION_PRIMARY}
                          >
                            {isSavingRow ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingUrl("");
                            }}
                            className={ADMIN_TABLE_ACTION_SECONDARY}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(rowId);
                            setEditingUrl(row.url ?? "");
                            setErrorMessage(null);
                          }}
                          className={ADMIN_TABLE_ACTION_SECONDARY}
                        >
                          Edit
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void handleDelete(row.id)}
                        disabled={isDeletingRow}
                        className={ADMIN_DANGER_BUTTON}
                      >
                        {isDeletingRow ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {sortedRows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-slate-400" colSpan={6}>
                  No images found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
