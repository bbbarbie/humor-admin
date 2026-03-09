"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADMIN_BADGE_NEUTRAL,
  ADMIN_BADGE_POSITIVE,
  ADMIN_DANGER_BUTTON,
  ADMIN_ALERT_ERROR,
  ADMIN_ALERT_SUCCESS,
  ADMIN_INPUT,
  ADMIN_PANEL,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SELECT,
  ADMIN_TABLE_ACTION_PRIMARY,
  ADMIN_TABLE_ACTION_SECONDARY,
  ADMIN_TABLE_HEAD,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_WRAPPER,
} from "@/components/admin/theme";
import { formatUtc } from "@/lib/format-utc";
import type { AdminResourceUiConfig, ResourceMode } from "@/lib/admin/resources";

type Primitive = string | number | boolean;
type Row = Record<string, unknown>;
type RowIdentity = { keyColumn: string; keyValue: Primitive };
type FieldInputKind = "text" | "textarea" | "number" | "boolean";

type Props = {
  resourceSlug: string;
  mode: ResourceMode;
  ui?: AdminResourceUiConfig;
};

const KEY_CANDIDATES = ["id", "uuid", "email", "domain", "slug", "key", "name"];
const COLUMN_PRIORITY = [
  "id",
  "name",
  "title",
  "image_description",
  "caption",
  "explanation",
  "humor_flavor_id",
  "caption_count",
  "step_order",
  "sequence",
  "llm_model_id",
  "llm_system_prompt",
  "llm_user_prompt",
  "llm_model_response",
  "email",
  "domain",
  "is_active",
  "is_enabled",
  "is_public",
  "created_at",
  "updated_at",
  "created_datetime_utc",
  "modified_datetime_utc",
];

function isPrimitive(value: unknown): value is Primitive {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function detectIdentity(row: Row): RowIdentity | null {
  for (const key of KEY_CANDIDATES) {
    if (key in row && isPrimitive(row[key])) {
      return { keyColumn: key, keyValue: row[key] };
    }
  }

  for (const [key, value] of Object.entries(row)) {
    if (isPrimitive(value)) {
      return { keyColumn: key, keyValue: value };
    }
  }

  return null;
}

function stringifyPretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function sortColumns(columns: string[]): string[] {
  return [...columns].sort((a, b) => {
    const aIndex = COLUMN_PRIORITY.indexOf(a);
    const bIndex = COLUMN_PRIORITY.indexOf(b);

    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      if (aIndex !== bIndex) return aIndex - bIndex;
    }

    return a.localeCompare(b);
  });
}

function matchesSearch(row: Row, search: string): boolean {
  if (!search) return true;
  const haystack = JSON.stringify(row).toLowerCase();
  return haystack.includes(search);
}

function compactText(value: string, max = 120): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

function isDateLikeColumn(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return (
    lowerKey.endsWith("_datetime_utc") ||
    lowerKey.endsWith("_utc") ||
    lowerKey.endsWith("_at") ||
    lowerKey === "created" ||
    lowerKey === "updated" ||
    lowerKey === "modified"
  );
}

function isManagedColumn(column: string): boolean {
  const lowerKey = column.toLowerCase();
  return (
    lowerKey === "id" ||
    lowerKey.endsWith("_id") ||
    lowerKey.endsWith("_at") ||
    lowerKey.endsWith("_datetime_utc") ||
    lowerKey.endsWith("_utc") ||
    lowerKey.includes("created") ||
    lowerKey.includes("updated") ||
    lowerKey.includes("modified")
  );
}

function renderCell(value: unknown, key: string) {
  if (value === null || value === undefined) {
    return <span className="text-slate-500">-</span>;
  }

  if (typeof value === "boolean") {
    return value ? (
      <span className={ADMIN_BADGE_POSITIVE}>True</span>
    ) : (
      <span className={ADMIN_BADGE_NEUTRAL}>False</span>
    );
  }

  if (typeof value === "number") {
    return <span className="font-mono text-slate-200">{value}</span>;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const lowerKey = key.toLowerCase();

    if (isDateLikeColumn(lowerKey)) {
      const formatted = formatUtc(trimmed);
      return <span className="font-mono text-slate-200">{formatted}</span>;
    }

    if ((lowerKey.includes("url") || trimmed.startsWith("http")) && /^https?:\/\//i.test(trimmed)) {
      return (
        <a
          href={trimmed}
          target="_blank"
          rel="noreferrer"
          title={trimmed}
          className="block max-w-[340px] truncate text-slate-200 underline decoration-slate-500 underline-offset-2 hover:text-blue-300"
        >
          {compactText(trimmed, 90)}
        </a>
      );
    }

    const looksLong = trimmed.length > 100 || trimmed.includes("\n");

    if (looksLong) {
      return (
        <details className="max-w-[520px] rounded-lg bg-slate-950/30 p-2">
          <summary className="cursor-pointer list-none text-xs text-slate-300 hover:text-slate-100">
            {compactText(trimmed.replaceAll("\n", " "), 180)}
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950/60 p-2 text-xs text-slate-200">
            {trimmed}
          </pre>
        </details>
      );
    }

    return (
      <span title={trimmed} className="block max-w-[340px] truncate text-slate-200">
        {trimmed || "-"}
      </span>
    );
  }

  return (
    <pre className="max-w-[420px] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950/60 p-2 text-xs text-slate-300">
      {compactText(stringifyPretty(value), 1200)}
    </pre>
  );
}

function inferFieldInputKind(column: string, sampleValue: unknown, ui?: AdminResourceUiConfig): FieldInputKind {
  const configuredKind = ui?.fieldInputs?.[column];
  if (configuredKind) return configuredKind;
  if (typeof sampleValue === "boolean") return "boolean";
  if (typeof sampleValue === "number") return "number";

  const lowerColumn = column.toLowerCase();
  if (
    lowerColumn.includes("prompt") ||
    lowerColumn.includes("caption") ||
    lowerColumn.includes("description") ||
    lowerColumn.includes("explanation")
  ) {
    return "textarea";
  }

  return "text";
}

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function getFallbackCreateFields(columns: string[], sampleByColumn: Record<string, unknown>): string[] {
  return columns.filter((column) => {
    if (isManagedColumn(column)) return false;
    const sample = sampleByColumn[column];
    return sample === undefined || isPrimitive(sample) || sample === null;
  });
}

function getFallbackEditFields(columns: string[], row: Row, identityColumn?: string): string[] {
  return columns.filter((column) => {
    if (column === identityColumn) return false;
    if (isManagedColumn(column)) return false;
    const value = row[column];
    return value === null || value === undefined || isPrimitive(value);
  });
}

function buildPayloadValues(
  fields: string[],
  formValues: Record<string, string>,
  rowForTypeInference: Row | null,
  sampleByColumn: Record<string, unknown>,
  ui?: AdminResourceUiConfig,
): Row {
  const values: Row = {};

  for (const field of fields) {
    const raw = formValues[field] ?? "";
    const sample = rowForTypeInference ? rowForTypeInference[field] : sampleByColumn[field];
    const kind = inferFieldInputKind(field, sample, ui);

    if (kind === "number") {
      if (raw.trim() === "") {
        values[field] = null;
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Field '${field}' must be a valid number.`);
      }
      values[field] = parsed;
      continue;
    }

    if (kind === "boolean") {
      values[field] = raw === "true";
      continue;
    }

    values[field] = raw;
  }

  return values;
}

function FormField({
  field,
  value,
  sampleValue,
  ui,
  onChange,
}: {
  field: string;
  value: string;
  sampleValue: unknown;
  ui?: AdminResourceUiConfig;
  onChange: (value: string) => void;
}) {
  const kind = inferFieldInputKind(field, sampleValue, ui);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-300">{field}</span>
      {kind === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={6} className={ADMIN_INPUT} />
      ) : kind === "boolean" ? (
        <select value={value === "true" ? "true" : "false"} onChange={(event) => onChange(event.target.value)} className={ADMIN_SELECT}>
          <option value="false">False</option>
          <option value="true">True</option>
        </select>
      ) : (
        <input
          type={kind === "number" ? "number" : "text"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={ADMIN_INPUT}
        />
      )}
    </label>
  );
}

export function AdminResourceClient({ resourceSlug, mode, ui }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormValues, setCreateFormValues] = useState<Record<string, string>>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editFormValues, setEditFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const endpoint = `/api/admin/resources/${resourceSlug}`;

  async function parseResponse<T>(response: Response): Promise<T> {
    const json = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      throw new Error(json.error ?? "Request failed");
    }
    return json;
  }

  const loadRows = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${endpoint}?limit=1000`, { cache: "no-store" });
      const result = await parseResponse<{ rows?: Row[] }>(response);
      setRows(Array.isArray(result.rows) ? result.rows : []);
      setErrorMessage(null);
    } catch (error) {
      setRows([]);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load rows.");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) keys.add(key);
    }
    return sortColumns([...keys]);
  }, [rows]);

  const sampleByColumn = useMemo(() => {
    const sample: Record<string, unknown> = {};
    for (const column of columns) {
      for (const row of rows) {
        const value = row[column];
        if (value !== undefined && value !== null) {
          sample[column] = value;
          break;
        }
      }
    }
    return sample;
  }, [columns, rows]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return rows.filter((row) => matchesSearch(row, normalized));
  }, [rows, search]);

  const rowByDisplayKey = useMemo(() => {
    const map = new Map<string, Row>();
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      map.set(rowDisplayKey(row, index), row);
    }
    return map;
  }, [rows]);

  const canCreate = mode === "crud";
  const canDelete = mode === "crud";
  const canUpdate = mode !== "read";
  const useModalCreate = Boolean(ui?.modalCreate);
  const useModalEdit = Boolean(ui?.modalEdit);
  const useInlineEdit = Boolean(ui?.inlineEdit || !useModalEdit);

  function rowDisplayKey(row: Row, index: number): string {
    const identity = detectIdentity(row);
    if (!identity) return `idx-${index}`;
    return `${identity.keyColumn}:${String(identity.keyValue)}`;
  }

  function getCreateFields(): string[] {
    if (ui?.createFields?.length) return ui.createFields;
    return getFallbackCreateFields(columns, sampleByColumn);
  }

  function getEditFieldsForRow(row: Row): string[] {
    if (ui?.editFields?.length) return ui.editFields;
    const identity = detectIdentity(row);
    return getFallbackEditFields(columns, row, identity?.keyColumn);
  }

  function openCreateForm() {
    const fields = getCreateFields();
    const nextValues: Record<string, string> = {};
    for (const field of fields) nextValues[field] = "";

    setCreateFormValues(nextValues);
    setShowCreateForm(true);
    setErrorMessage(null);
  }

  function closeCreateForm() {
    setShowCreateForm(false);
    setCreateFormValues({});
  }

  function openEditForm(row: Row, key: string) {
    const fields = getEditFieldsForRow(row);
    const nextValues: Record<string, string> = {};
    for (const field of fields) nextValues[field] = toInputValue(row[field]);

    setEditFormValues(nextValues);
    setEditKey(key);
    setErrorMessage(null);
  }

  function closeEditForm() {
    setEditKey(null);
    setEditFormValues({});
  }

  async function handleCreate() {
    const fields = getCreateFields();
    if (fields.length === 0) {
      setErrorMessage("No editable create fields are configured for this resource.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const values = buildPayloadValues(fields, createFormValues, null, sampleByColumn, ui);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });

      const result = await parseResponse<{ message?: string }>(response);
      setSuccessMessage(result.message ?? "Row created.");
      closeCreateForm();
      await loadRows();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create row.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(row: Row) {
    const identity = detectIdentity(row);
    if (!identity) {
      setErrorMessage("No key field could be inferred for this row, so update is unavailable.");
      return;
    }

    const fields = getEditFieldsForRow(row);
    if (fields.length === 0) {
      setErrorMessage("No editable fields are configured for this resource.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const values = buildPayloadValues(fields, editFormValues, row, sampleByColumn, ui);

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyColumn: identity.keyColumn,
          keyValue: identity.keyValue,
          values,
        }),
      });

      const result = await parseResponse<{ message?: string }>(response);
      setSuccessMessage(result.message ?? "Row updated.");
      closeEditForm();
      await loadRows();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update row.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(row: Row) {
    const identity = detectIdentity(row);
    if (!identity) {
      setErrorMessage("No key field could be inferred for this row, so delete is unavailable.");
      return;
    }

    const confirmed = window.confirm(`Delete row where ${identity.keyColumn} = ${String(identity.keyValue)}?`);
    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyColumn: identity.keyColumn, keyValue: identity.keyValue }),
      });

      const result = await parseResponse<{ message?: string }>(response);
      setSuccessMessage(result.message ?? "Row deleted.");
      await loadRows();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete row.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const createFields = showCreateForm ? getCreateFields() : [];
  const editRow = editKey ? rowByDisplayKey.get(editKey) ?? null : null;
  const editFields = editRow ? getEditFieldsForRow(editRow) : [];

  return (
    <div className="space-y-4">
      {successMessage ? <p className={ADMIN_ALERT_SUCCESS}>{successMessage}</p> : null}
      {errorMessage ? <p className={ADMIN_ALERT_ERROR}>{errorMessage}</p> : null}

      <div className={`${ADMIN_PANEL} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Records</h3>
            <p className="mt-1 text-sm text-slate-400">Search loaded rows and inspect full table data.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={ADMIN_SECONDARY_BUTTON}
              onClick={() => void loadRows()}
              disabled={isLoading || isSubmitting}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            {canCreate ? (
              <button
                type="button"
                className={ADMIN_PRIMARY_BUTTON}
                onClick={() => {
                  if (showCreateForm) {
                    closeCreateForm();
                    return;
                  }
                  openCreateForm();
                }}
              >
                {showCreateForm ? "Close Create" : "Create Row"}
              </button>
            ) : null}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-300">Search rows</span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={ADMIN_INPUT}
            placeholder="Filter by any text in the row"
          />
        </label>

        <p className="text-sm text-slate-400">
          Showing {filteredRows.length} of {rows.length} rows
        </p>
      </div>

      {canCreate && showCreateForm && !useModalCreate ? (
        <div className={`${ADMIN_PANEL} space-y-3`}>
          <h3 className="text-base font-semibold text-slate-100">Create Row</h3>
          {createFields.length === 0 ? (
            <p className="text-sm text-slate-400">No create fields are configured for this resource.</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {createFields.map((field) => (
                  <FormField
                    key={field}
                    field={field}
                    value={createFormValues[field] ?? ""}
                    sampleValue={sampleByColumn[field]}
                    ui={ui}
                    onChange={(value) => setCreateFormValues((current) => ({ ...current, [field]: value }))}
                  />
                ))}
              </div>
              <button
                type="button"
                className={ADMIN_PRIMARY_BUTTON}
                onClick={() => void handleCreate()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </>
          )}
        </div>
      ) : null}

      <div className={ADMIN_TABLE_WRAPPER}>
        <table className="min-w-full text-left text-sm">
          <thead className={ADMIN_TABLE_HEAD}>
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3.5 font-semibold">
                  {column}
                </th>
              ))}
              {canUpdate || canDelete ? <th className="px-4 py-3.5 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const thisKey = rowDisplayKey(row, index);
              const identity = detectIdentity(row);
              const isEditingRow = editKey === thisKey;

              return (
                <tr
                  key={thisKey}
                  className={`${ADMIN_TABLE_ROW} ${index % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"}`}
                >
                  {columns.map((column) => (
                    <td key={`${thisKey}-${column}`} className="px-4 py-3.5">
                      {renderCell(row[column], column)}
                    </td>
                  ))}

                  {canUpdate || canDelete ? (
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {canUpdate ? (
                          <button
                            type="button"
                            onClick={() => openEditForm(row, thisKey)}
                            className={ADMIN_TABLE_ACTION_SECONDARY}
                            disabled={!identity || isSubmitting}
                            title={!identity ? "No key field found for this row" : undefined}
                          >
                            Edit
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            className={ADMIN_DANGER_BUTTON}
                            disabled={!identity || isSubmitting}
                            title={!identity ? "No key field found for this row" : undefined}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>

                      {isEditingRow && canUpdate && useInlineEdit ? (
                        <div className="mt-3 space-y-2 rounded-xl border border-slate-700/60 bg-slate-950/50 p-2">
                          {editFields.length === 0 ? (
                            <p className="text-xs text-slate-400">No editable fields are configured for this resource.</p>
                          ) : (
                            <div className="grid gap-3 lg:grid-cols-2">
                              {editFields.map((field) => (
                                <FormField
                                  key={`${thisKey}-${field}`}
                                  field={field}
                                  value={editFormValues[field] ?? ""}
                                  sampleValue={row[field]}
                                  ui={ui}
                                  onChange={(value) => setEditFormValues((current) => ({ ...current, [field]: value }))}
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className={ADMIN_TABLE_ACTION_PRIMARY}
                              onClick={() => void handleUpdate(row)}
                              disabled={isSubmitting || !identity || editFields.length === 0}
                            >
                              {isSubmitting ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className={ADMIN_TABLE_ACTION_SECONDARY}
                              onClick={closeEditForm}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}

            {!isLoading && filteredRows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-slate-400"
                  colSpan={Math.max(columns.length + (canUpdate || canDelete ? 1 : 0), 1)}
                >
                  {rows.length === 0 ? "No rows found." : "No rows match your search."}
                </td>
              </tr>
            ) : null}

            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-slate-400"
                  colSpan={Math.max(columns.length + (canUpdate || canDelete ? 1 : 0), 1)}
                >
                  Loading rows...
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {canCreate && showCreateForm && useModalCreate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className={`${ADMIN_PANEL} w-full max-w-3xl space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-100">Create Row</h3>
              <button type="button" className={ADMIN_SECONDARY_BUTTON} onClick={closeCreateForm}>
                Close
              </button>
            </div>

            {createFields.length === 0 ? (
              <p className="text-sm text-slate-400">No create fields are configured for this resource.</p>
            ) : (
              <>
                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {createFields.map((field) => (
                    <FormField
                      key={`modal-create-${field}`}
                      field={field}
                      value={createFormValues[field] ?? ""}
                      sampleValue={sampleByColumn[field]}
                      ui={ui}
                      onChange={(value) => setCreateFormValues((current) => ({ ...current, [field]: value }))}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className={ADMIN_SECONDARY_BUTTON} onClick={closeCreateForm} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={ADMIN_PRIMARY_BUTTON}
                    onClick={() => void handleCreate()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {canUpdate && useModalEdit && editRow ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className={`${ADMIN_PANEL} w-full max-w-3xl space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-100">Edit Row</h3>
              <button type="button" className={ADMIN_SECONDARY_BUTTON} onClick={closeEditForm}>
                Close
              </button>
            </div>

            {editFields.length === 0 ? (
              <p className="text-sm text-slate-400">No editable fields are configured for this resource.</p>
            ) : (
              <>
                <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {editFields.map((field) => (
                    <FormField
                      key={`modal-edit-${field}`}
                      field={field}
                      value={editFormValues[field] ?? ""}
                      sampleValue={editRow[field]}
                      ui={ui}
                      onChange={(value) => setEditFormValues((current) => ({ ...current, [field]: value }))}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className={ADMIN_SECONDARY_BUTTON} onClick={closeEditForm} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={ADMIN_PRIMARY_BUTTON}
                    onClick={() => void handleUpdate(editRow)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
