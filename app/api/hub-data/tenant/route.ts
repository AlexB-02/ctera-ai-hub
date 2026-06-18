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

/** POST body: `{ "tenant": { ... } }` or a single tenant object at the root. */
function extractTenantPayload(body: unknown): unknown {
  if (body && typeof body === "object" && "tenant" in body) {
    return (body as { tenant: unknown }).tenant
  }
  return body
}

export async function POST(req: Request) {
  if (!checkWriteAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const raw = extractTenantPayload(body)
    const maybeRows = Array.isArray(raw)
      ? raw
      : body && typeof body === "object" && "rows" in body && Array.isArray((body as { rows: unknown }).rows)
        ? (body as { rows: unknown[] }).rows
        : null
    if (maybeRows && isFeatureInventoryArray(maybeRows)) {
      return NextResponse.json(
        {
          error:
            "This JSON is a feature inventory export, not a single tenant. Use POST /api/hub-data/tenant/from-features or import the array via Admin → Tenants.",
        },
        { status: 400 },
      )
    }
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
