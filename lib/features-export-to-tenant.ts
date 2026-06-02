import { z } from "zod"
import type { Tenant } from "@/lib/hub-schema"

/** Rows exported from portal feature inventory (e.g. features_clean.json). */
export const featureInventoryRowSchema = z.object({
  scope: z.coerce.string(),
  source: z.coerce.string(),
  status: z.coerce.string(),
  feature: z.coerce.string(),
  portal_name: z.coerce.string(),
  feature_group: z.coerce.string(),
})

export type FeatureInventoryRow = z.infer<typeof featureInventoryRowSchema>

/**
 * Many exports use unquoted portal tokens, e.g. `"portal_name": ctera.me`
 * which is not valid JSON. Quote bare tokens after portal_name.
 */
export function repairFeatureInventoryJson(text: string): string {
  return text.replace(
    /"portal_name"\s*:\s*([a-zA-Z0-9][a-zA-Z0-9._-]*)(\s*[,}\]])/g,
    '"portal_name": "$1"$2',
  )
}

export function parseFeatureInventoryRows(text: string): FeatureInventoryRow[] {
  const repaired = repairFeatureInventoryJson(text.replace(/^\uFEFF/, "").trim())
  const data = JSON.parse(repaired) as unknown
  if (!Array.isArray(data)) {
    throw new Error("Expected a JSON array of feature rows")
  }
  return data.map((row, i) => {
    const r = featureInventoryRowSchema.safeParse(row)
    if (!r.success) {
      throw new Error(`Invalid row at index ${i}: ${r.error.message}`)
    }
    return r.data
  })
}

function isOn(status: string): boolean {
  return status.trim().toUpperCase() === "ON"
}

function tenantIdFromPortalName(portalName: string): string {
  const slug = portalName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return slug || "tenant"
}

function domainFromPortalName(portalName: string): string {
  const t = portalName.trim()
  if (t.includes(".")) return t
  return `${t}.ctera.com`
}

/** Build hub tenant fields from all rows for one portal. */
export function tenantFromFeatureRows(
  portalName: string,
  rows: FeatureInventoryRow[],
  options?: {
    region?: string
    users?: number
    storage?: string
    status?: Tenant["status"]
    plan?: Tenant["plan"]
  },
): Tenant {
  const mine = rows.filter((r) => r.portal_name.trim() === portalName.trim())
  if (mine.length === 0) {
    throw new Error(`No rows for portal_name "${portalName}"`)
  }

  const enabled = mine.filter((r) => isOn(r.status)).length
  const featureAdoption = Math.round((100 * enabled) / mine.length)

  const name = portalName.trim()
  const id = tenantIdFromPortalName(name)

  return {
    id,
    name,
    domain: domainFromPortalName(name),
    region: options?.region ?? "—",
    users: options?.users ?? 0,
    storage: options?.storage ?? "—",
    featureAdoption,
    status: options?.status ?? "active",
    plan: options?.plan ?? "Enterprise",
    contentProfile: "features-only" as const,
  }
}

export function distinctPortalNames(rows: FeatureInventoryRow[]): string[] {
  const set = new Set<string>()
  for (const r of rows) {
    set.add(r.portal_name.trim())
  }
  return [...set].sort()
}
