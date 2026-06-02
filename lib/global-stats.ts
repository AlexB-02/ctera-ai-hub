import type { Tenant } from "@/lib/hub-schema"

export type GlobalStats = {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  totalStorage: number
  averageFeatureAdoption: number
}

export function computeGlobalStats(tenants: Tenant[]): GlobalStats {
  const n = tenants.length || 1
  return {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.status === "active").length,
    totalUsers: tenants.reduce((sum, t) => sum + t.users, 0),
    totalStorage: tenants.reduce((sum, t) => sum + Number.parseFloat(t.storage), 0),
    averageFeatureAdoption: Math.round(tenants.reduce((sum, t) => sum + t.featureAdoption, 0) / n),
  }
}
