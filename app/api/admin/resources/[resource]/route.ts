import { NextResponse } from "next/server";
import { requireSuperadminForApi } from "@/lib/admin/require-superadmin-api";
import { ADMIN_RESOURCE_CONFIGS } from "@/lib/admin/resources";

type JsonObject = Record<string, unknown>;

function getConfig(resource: string) {
  return ADMIN_RESOURCE_CONFIGS[resource] ?? null;
}

function isPlainObject(value: unknown): value is JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isValidColumnName(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireSuperadminForApi();
  if ("error" in auth) return auth.error;

  const { resource } = await context.params;
  const config = getConfig(resource);

  if (!config) {
    return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  }

  const url = new URL(request.url);
  const parsedLimit = Number(url.searchParams.get("limit") ?? "500");
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 1000)) : 500;

  const { data, error } = await auth.supabase.from(config.table).select("*").limit(limit);

  if (error) {
    return NextResponse.json({ error: `Failed to load ${config.title}: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ rows: data ?? [], mode: config.mode, table: config.table });
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireSuperadminForApi();
  if ("error" in auth) return auth.error;

  const { resource } = await context.params;
  const config = getConfig(resource);

  if (!config) {
    return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  }

  if (config.mode !== "crud") {
    return NextResponse.json({ error: "Create is not allowed for this resource." }, { status: 405 });
  }

  const body = (await request.json().catch(() => ({}))) as { values?: unknown };

  if (!isPlainObject(body.values)) {
    return NextResponse.json({ error: "Request must include a JSON object in 'values'." }, { status: 400 });
  }

  const { data, error } = await auth.supabase.from(config.table).insert(body.values).select("*").limit(1).maybeSingle();

  if (error) {
    return NextResponse.json({ error: `Failed to create row: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ row: data, message: "Row created successfully." });
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireSuperadminForApi();
  if ("error" in auth) return auth.error;

  const { resource } = await context.params;
  const config = getConfig(resource);

  if (!config) {
    return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  }

  if (config.mode === "read") {
    return NextResponse.json({ error: "Update is not allowed for this resource." }, { status: 405 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    keyColumn?: unknown;
    keyValue?: unknown;
    values?: unknown;
  };

  if (!isValidColumnName(body.keyColumn)) {
    return NextResponse.json({ error: "A valid keyColumn is required." }, { status: 400 });
  }

  if (!isPrimitive(body.keyValue)) {
    return NextResponse.json({ error: "A primitive keyValue is required." }, { status: 400 });
  }

  if (!isPlainObject(body.values)) {
    return NextResponse.json({ error: "Request must include a JSON object in 'values'." }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from(config.table)
    .update(body.values)
    .eq(body.keyColumn, body.keyValue)
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `Failed to update row: ${error.message}` }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "No matching row was found to update." }, { status: 404 });
  }

  return NextResponse.json({ row: data, message: "Row updated successfully." });
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireSuperadminForApi();
  if ("error" in auth) return auth.error;

  const { resource } = await context.params;
  const config = getConfig(resource);

  if (!config) {
    return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  }

  if (config.mode !== "crud") {
    return NextResponse.json({ error: "Delete is not allowed for this resource." }, { status: 405 });
  }

  const body = (await request.json().catch(() => ({}))) as { keyColumn?: unknown; keyValue?: unknown };

  if (!isValidColumnName(body.keyColumn)) {
    return NextResponse.json({ error: "A valid keyColumn is required." }, { status: 400 });
  }

  if (!isPrimitive(body.keyValue)) {
    return NextResponse.json({ error: "A primitive keyValue is required." }, { status: 400 });
  }

  const { error } = await auth.supabase.from(config.table).delete().eq(body.keyColumn, body.keyValue);

  if (error) {
    return NextResponse.json({ error: `Failed to delete row: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ message: "Row deleted successfully." });
}
