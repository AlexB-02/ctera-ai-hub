import type { Tenant } from "@/lib/hub-schema"
import type { SeedHubData } from "@/lib/seed-hub"

/** Append tenant or replace the entry with the same `id`. */
export function upsertTenantInHub(hub: SeedHubData, tenant: Tenant): SeedHubData {
  const idx = hub.tenants.findIndex((t) => t.id === tenant.id)
  const tenants =
    idx === -1
      ? [...hub.tenants, tenant]
      : [...hub.tenants.slice(0, idx), tenant, ...hub.tenants.slice(idx + 1)]
  return { ...hub, tenants }
}
