import type { Tenant } from "@/lib/hub-schema"
import type { SeedHubData } from "@/lib/seed-hub"

type PortalExport = {
  exportedAt?: string
  portalDnsSuffix?: string
  featureCount?: number
  features?: Record<string, PortalExportFeature[]>
  deviceList?: unknown[]
}

type PortalExportFeature = {
  name: string
  data?: unknown
}

type FeatureBucket = keyof SeedHubData["featureAdoption"]["featureAdoptionData"]

const CATEGORY_TO_BUCKET: Record<string, FeatureBucket> = {
  Infrastructure: "infrastructure",
  Services: "services",
  "Tenant Settings": "tenantSettings",
  "Global Settings": "globalSettings",
}

function slugFromPortalName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tenant"
  )
}

function featureEnabled(data: unknown): boolean {
  if (data == null) return false
  if (Array.isArray(data)) return data.length > 0
  if (typeof data !== "object") return false

  const o = data as Record<string, unknown>
  for (const key of ["enabled", "licensed", "allowEmbeddingEndUserPortal", "extendedAuditLogEnabled", "insightEnabled"]) {
    const v = o[key]
    if (v === true || v === "true") return true
  }

  for (const v of Object.values(o)) {
    if (Array.isArray(v) && v.length > 0) return true
  }

  return Object.values(o).some(
    (v) => v !== null && v !== undefined && v !== "" && v !== false && v !== "false" && v !== "Disabled",
  )
}

function buildCategorySummary(
  prdData: SeedHubData["featureAdoption"]["prdData"],
): SeedHubData["featureAdoption"]["categorySummary"] {
  const map = new Map<string, { total: number; enabled: number; disabled: number }>()
  for (const p of prdData) {
    const cur = map.get(p.category) ?? { total: 0, enabled: 0, disabled: 0 }
    cur.total++
    if (p.enabled) cur.enabled++
    else cur.disabled++
    map.set(p.category, cur)
  }
  return [...map.entries()].map(([label, s]) => ({ label, ...s }))
}

export function featureAdoptionFromPortalExport(exportDoc: PortalExport): SeedHubData["featureAdoption"] {
  const featureAdoptionData: SeedHubData["featureAdoption"]["featureAdoptionData"] = {
    infrastructure: [],
    services: [],
    tenantSettings: [],
    globalSettings: [],
  }
  const prdData: SeedHubData["featureAdoption"]["prdData"] = []

  for (const [category, items] of Object.entries(exportDoc.features ?? {})) {
    const bucket = CATEGORY_TO_BUCKET[category]
    if (!bucket || !Array.isArray(items)) continue

    for (const item of items) {
      if (!item?.name) continue
      const enabled = featureEnabled(item.data)
      const description = "Imported from Portal feature export."
      featureAdoptionData[bucket].push({ name: item.name, description, enabled })
      prdData.push({
        category: category as SeedHubData["featureAdoption"]["prdData"][number]["category"],
        name: item.name,
        description,
        purpose: exportDoc.exportedAt ? `Exported at ${exportDoc.exportedAt}.` : "From Portal SQL export.",
        requirement: "Derived from Portal feature-export SQL.",
        enabled,
      })
    }
  }

  return {
    featureAdoptionData,
    prdData,
    categorySummary: buildCategorySummary(prdData),
  }
}

export function tenantFromPortalExport(
  exportDoc: PortalExport,
  options?: { portalName?: string },
): Tenant {
  const portalName = options?.portalName?.trim() || exportDoc.portalDnsSuffix?.trim() || "portal"
  const domain = exportDoc.portalDnsSuffix?.trim() || `${portalName}.ctera.com`
  const featureAdoption = featureAdoptionFromPortalExport(exportDoc)
  const total = featureAdoption.prdData.length
  const enabled = featureAdoption.prdData.filter((f) => f.enabled).length
  const pct = total > 0 ? Math.round((100 * enabled) / total) : 0

  return {
    id: slugFromPortalName(portalName),
    name: portalName,
    domain,
    region: "—",
    users: Array.isArray(exportDoc.deviceList) ? exportDoc.deviceList.length : 0,
    storage: "—",
    featureAdoption: pct,
    status: "active",
    plan: "Enterprise",
    contentProfile: "features-only",
  }
}
