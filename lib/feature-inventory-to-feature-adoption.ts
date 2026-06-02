import type { FeatureInventoryRow } from "@/lib/features-export-to-tenant"
import type { SeedHubData } from "@/lib/seed-hub"

type HubFeatureAdoption = SeedHubData["featureAdoption"]
type FeatureAdoptionGroups = HubFeatureAdoption["featureAdoptionData"]
type PrdRow = HubFeatureAdoption["prdData"][number]

function isOn(status: string): boolean {
  return status.trim().toUpperCase() === "ON"
}

function classify(featureGroup: string): { category: PrdRow["category"]; bucket: keyof FeatureAdoptionGroups } {
  const g = featureGroup.trim().toLowerCase()
  if (g.includes("infrastruct")) return { category: "Infrastructure", bucket: "infrastructure" }
  if (g.includes("global")) return { category: "Global Settings", bucket: "globalSettings" }
  if (g.includes("tenant")) return { category: "Tenant Settings", bucket: "tenantSettings" }
  if (g.includes("service")) return { category: "Services", bucket: "services" }
  return { category: "Services", bucket: "services" }
}

function buildCategorySummary(prdData: PrdRow[]): HubFeatureAdoption["categorySummary"] {
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

/** Build hub `featureAdoption` payload from portal feature-inventory rows for one portal. */
export function featureAdoptionFromInventoryRows(
  portalName: string,
  rows: FeatureInventoryRow[],
): HubFeatureAdoption {
  const mine = rows.filter((r) => r.portal_name.trim() === portalName.trim())
  const featureAdoptionData: FeatureAdoptionGroups = {
    infrastructure: [],
    services: [],
    tenantSettings: [],
    globalSettings: [],
  }
  const prdData: PrdRow[] = []

  for (const row of mine) {
    const { category, bucket } = classify(row.feature_group)
    const enabled = isOn(row.status)
    const description =
      [row.scope?.trim(), row.source?.trim()].filter(Boolean).join(" · ") || row.feature_group.trim() || row.feature
    featureAdoptionData[bucket].push({
      name: row.feature,
      description,
      enabled,
    })
    prdData.push({
      category,
      name: row.feature,
      description,
      purpose: row.scope?.trim() ? `Scope: ${row.scope.trim()}` : "From feature inventory.",
      requirement: row.source?.trim()
        ? `Source: ${row.source.trim()}`
        : "Derived from portal feature inventory export.",
      enabled,
    })
  }

  return {
    featureAdoptionData,
    prdData,
    categorySummary: buildCategorySummary(prdData),
  }
}
