import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { tenantSchema } from "@/lib/hub-schema"
import {
  loadEffectiveHubData,
  writeHubDocumentAtomic,
} from "@/lib/hub-persist"
import { upsertTenantInHub } from "@/lib/hub-tenant-merge"
import { isFeatureInventoryArray } from "@/lib/feature-inventory-guards"

export const dynamic = "force-dynamic"

function checkWriteAuthorized(req: Request): boolean {
  const token = process.env.HUB_ADMIN_TOKEN
  if (!token) return true
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

export async function POST(req: Request) {
  if (!checkWriteAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
  }

  const file = form.get("file")
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: 'Missing file field "file"' }, { status: 400 })
  }

  const name = file.name?.toLowerCase() ?? ""
  if (!name.endsWith(".json")) {
    return NextResponse.json({ error: "Upload must be a .json file" }, { status: 400 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, "").trim())
  } catch {
    return NextResponse.json({ error: "File is not valid JSON" }, { status: 400 })
  }

  const raw =
    parsed && typeof parsed === "object" && "tenant" in parsed
      ? (parsed as { tenant: unknown }).tenant
      : parsed

  const maybeRows = Array.isArray(raw)
    ? raw
    : parsed &&
        typeof parsed === "object" &&
        "rows" in parsed &&
        Array.isArray((parsed as { rows: unknown }).rows)
      ? (parsed as { rows: unknown[] }).rows
      : null

  if (maybeRows && isFeatureInventoryArray(maybeRows)) {
    return NextResponse.json(
      {
        error:
          "This JSON is a feature inventory (an array of features with portal_name), not a single tenant object. Use “Import from feature inventory JSON” below, or POST /api/hub-data/tenant/from-features.",
      },
      { status: 400 },
    )
  }

  try {
    const tenant = tenantSchema.parse(raw)
    const hub = loadEffectiveHubData()
    const existed = hub.tenants.some((t) => t.id === tenant.id)
    const updated = upsertTenantInHub(hub, tenant)
    writeHubDocumentAtomic(updated)
    return NextResponse.json({
      ok: true,
      tenant,
      mode: existed ? "updated" : "added",
    })
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.flatten() }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "Failed to persist tenant" }, { status: 500 })
  }
}
