import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { customerSchema, deploymentSchema, tenantSchema } from "@/lib/hub-schema"
import { isPortalExportJson } from "@/lib/portal-export-guards"
import {
  upsertCustomerInHub,
  upsertDeploymentInHub,
  upsertDeploymentSpaceInHub,
} from "@/lib/hub-customer-merge"
import { upsertTenantInHub } from "@/lib/hub-tenant-merge"
import {
  customerFromPortalExport,
  deploymentFromPortalExport,
  deploymentSpaceFromPortalExport,
  legacyTenantFromPortalExport,
} from "@/lib/portal-export-to-deployment"
import {
  loadEffectiveHubData,
  writeHubDocumentAtomic,
} from "@/lib/hub-persist"

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
    const customer = customerFromPortalExport(body, { portalName })
    const deployment = deploymentFromPortalExport(body, customer.id, { portalName })
    const deploymentSpace = deploymentSpaceFromPortalExport(body)
    const tenant = legacyTenantFromPortalExport(body, { portalName })

    customerSchema.parse(customer)
    deploymentSchema.parse(deployment)
    tenantSchema.parse(tenant)

    let hub = loadEffectiveHubData()
    const existed =
      hub.deployments?.some((d) => d.id === deployment.id) ||
      hub.tenants.some((t) => t.id === tenant.id)

    hub = upsertCustomerInHub(hub, customer)
    hub = upsertDeploymentInHub(hub, deployment)
    hub = upsertDeploymentSpaceInHub(hub, deployment.id, deploymentSpace)
    hub = upsertTenantInHub(hub, tenant)

    writeHubDocumentAtomic(hub)

    return NextResponse.json({
      ok: true,
      customer,
      deployment,
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
