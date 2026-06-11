import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { tenantSchema } from "@/lib/hub-schema"
import { isPortalExportJson } from "@/lib/portal-export-guards"
import {
  featureAdoptionFromPortalExport,
  tenantFromPortalExport,
} from "@/lib/portal-export-to-tenant"
import {
  loadEffectiveHubData,
  writeHubDocumentAtomic,
} from "@/lib/hub-persist"
import { upsertTenantInHub } from "@/lib/hub-tenant-merge"

export const dynamic = "force-dynamic"

function checkWriteAuthorized(req: Request): boolean {
  const token = process.env.HUB_ADMIN_TOKEN
  if (!token) return true
  const auth = req.headers.get("authorization")
  return auth === `Bearer ${token}`
}

/** POST JSON body: Portal feature-export object (result of export_json SQL column). */
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

  if (!isPortalExportJson(body)) {
    return NextResponse.json(
      { error: "Expected Portal feature-export JSON (object with features.Infrastructure, etc.)." },
      { status: 400 },
    )
  }

  const url = new URL(req.url)
  const portalName = url.searchParams.get("portal")?.trim() || undefined

  try {
    const tenant = tenantFromPortalExport(body, { portalName })
    tenantSchema.parse(tenant)
    const featureAdoption = featureAdoptionFromPortalExport(body)

    let hub = loadEffectiveHubData()
    const existed = hub.tenants.some((t) => t.id === tenant.id)
    hub = upsertTenantInHub(hub, tenant)
    hub = {
      ...hub,
      tenantSpaces: {
        ...hub.tenantSpaces,
        [tenant.id]: {
          ...hub.tenantSpaces?.[tenant.id],
          featureAdoption,
        },
      },
    }
    writeHubDocumentAtomic(hub)

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
    return NextResponse.json({ error: "Failed to persist portal export" }, { status: 500 })
  }
}
