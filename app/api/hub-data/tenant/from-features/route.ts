import { NextResponse } from "next/server"
import { ZodError } from "zod"
import {
  distinctPortalNames,
  parseFeatureInventoryRows,
  tenantFromFeatureRows,
} from "@/lib/features-export-to-tenant"
import { featureAdoptionFromInventoryRows } from "@/lib/feature-inventory-to-feature-adoption"
import { tenantSchema } from "@/lib/hub-schema"
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

/**
 * POST JSON body: feature inventory array (e.g. features_clean.json), or `{ "rows": [...] }`.
 * Optional query: `?portal=demo` — import only that portal_name (otherwise all distinct portals).
 */
export async function POST(req: Request) {
  if (!checkWriteAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let rawText: string
  const ct = req.headers.get("content-type") ?? ""

  if (ct.includes("multipart/form-data")) {
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 })
    }
    const file = form.get("file")
    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json({ error: 'Missing non-empty file field "file"' }, { status: 400 })
    }
    rawText = await file.text()
  } else {
    try {
      const body = await req.json()
      rawText =
        body && typeof body === "object" && "rows" in body
          ? JSON.stringify((body as { rows: unknown }).rows)
          : JSON.stringify(body)
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
  }

  let rows: ReturnType<typeof parseFeatureInventoryRows>
  try {
    rows = parseFeatureInventoryRows(rawText)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const url = new URL(req.url)
  const portalFilter = url.searchParams.get("portal")?.trim()

  const portals = portalFilter
    ? [portalFilter]
    : distinctPortalNames(rows)

  if (portals.length === 0) {
    return NextResponse.json({ error: "No portal_name values in file" }, { status: 400 })
  }

  try {
    let hub = loadEffectiveHubData()
    const results: { tenant: unknown; mode: "added" | "updated" }[] = []

    for (const portalName of portals) {
      let tenant: ReturnType<typeof tenantFromFeatureRows>
      try {
        tenant = tenantFromFeatureRows(portalName, rows)
        tenantSchema.parse(tenant)
      } catch (e) {
        if (e instanceof ZodError) {
          return NextResponse.json(
            {
              error: `Validation failed for portal "${portalName}"`,
              details: e.flatten(),
            },
            { status: 400 },
          )
        }
        throw e
      }
      const existed = hub.tenants.some((t) => t.id === tenant.id)
      hub = upsertTenantInHub(hub, tenant)
      const featureAdoption = featureAdoptionFromInventoryRows(portalName, rows)
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
      results.push({ tenant, mode: existed ? "updated" : "added" })
    }

    writeHubDocumentAtomic(hub)

    return NextResponse.json({
      ok: true,
      imported: results,
      portals,
    })
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.flatten() }, { status: 400 })
    }
    console.error(e)
    const msg = e instanceof Error ? e.message : "Failed to persist"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
