import type { SeedHubData } from "@/lib/seed-hub"
import type { Tenant } from "@/lib/hub-schema"

type PortalDevice = SeedHubData["portal"]["devices"][number]
type LatestVersion = SeedHubData["dashboard"]["latestVersions"][number]

export type DeviceFleetKpi = {
  total: number
  edgeFilers: number
  offlineEdgeFilers: number
  driveDevices: number
  topDevices: PortalDevice[]
  remainingCount: number
  uniqueRegions: number
  criticalCount: number
  healthyCount: number
  healthRate: number
}

export type VersionKpi = {
  total: number
  upToDate: number
  updateRequired: number
  updateCritical: number
  upToDateRate: number
  products: LatestVersion[]
}

export type FeatureAdoptionKpi = {
  rate: number
  enabled: number
  total: number
  disabled: number
  categories: { label: string; enabled: number; total: number }[]
  fullyAdoptedCategories: number
}

export type StorageKpi = {
  usedLabel: string
  limitLabel: string
  usedPercent: number
  remainingLabel: string
}

export type LicenseKpi = {
  daysRemaining: number
  expiryLabel: string
  plan: string
  status: Tenant["status"] | "active"
  users: number | null
  renewalProgress: number
}

export function computeDeviceFleetKpi(devices: PortalDevice[]): DeviceFleetKpi {
  const sorted = [...devices].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
  const topDevices = sorted.slice(0, 3)
  const edgeFilers = devices.filter((d) => d.type.toLowerCase().includes("edge filer")).length
  const offlineEdgeFilers = devices.filter(
    (d) =>
      d.type.toLowerCase().includes("edge filer") &&
      (d.status === "update-critical" || d.status === "update-required"),
  ).length
  const driveDevices = devices.filter((d) => d.type.toLowerCase().includes("drive")).length
  const criticalCount = devices.filter((d) => d.status === "update-critical").length
  const healthyCount = devices.filter((d) => d.status === "up-to-date").length
  const uniqueRegions = new Set(devices.map((d) => d.location).filter(Boolean)).size

  return {
    total: devices.length,
    edgeFilers,
    offlineEdgeFilers,
    driveDevices,
    topDevices,
    remainingCount: Math.max(0, devices.length - topDevices.length),
    uniqueRegions,
    criticalCount,
    healthyCount,
    healthRate: devices.length === 0 ? 0 : Math.round((healthyCount / devices.length) * 100),
  }
}

export function computeVersionKpi(latestVersions: LatestVersion[]): VersionKpi {
  const upToDate = latestVersions.filter((v) => v.status === "up-to-date").length
  const updateRequired = latestVersions.filter((v) => v.status === "update-required").length
  const updateCritical = latestVersions.filter((v) => v.status === "update-critical").length

  return {
    total: latestVersions.length,
    upToDate,
    updateRequired,
    updateCritical,
    upToDateRate: latestVersions.length === 0 ? 0 : Math.round((upToDate / latestVersions.length) * 100),
    products: latestVersions.slice(0, 3),
  }
}

export function computeStorageKpi(tenant: Tenant | null): StorageKpi {
  const usedLabel = tenant?.storage ?? "92 TB"
  const usedPercent = tenant?.storage ? Math.min(99, Math.round(tenant.featureAdoption * 0.92)) : 92
  const limitTb = tenant?.plan === "Enterprise" ? 100 : tenant?.plan === "Business" ? 50 : 25
  const usedTb = parseInt(usedLabel, 10) || Math.round((usedPercent / 100) * limitTb)

  return {
    usedLabel,
    limitLabel: `${limitTb} TB`,
    usedPercent: tenant?.storage ? Math.min(99, Math.round((usedTb / limitTb) * 100)) : usedPercent,
    remainingLabel: `${Math.max(0, limitTb - usedTb)} TB free`,
  }
}

export function computeLicenseKpi(tenant: Tenant | null): LicenseKpi {
  const daysRemaining = 45
  return {
    daysRemaining,
    expiryLabel: "March 15, 2025",
    plan: tenant?.plan ?? "Enterprise",
    status: tenant?.status ?? "active",
    users: tenant?.users ?? null,
    renewalProgress: Math.round(((365 - daysRemaining) / 365) * 100),
  }
}

export function computeFeatureAdoptionRate(
  adoption: SeedHubData["featureAdoption"],
  tenant: Tenant | null,
): FeatureAdoptionKpi {
  const categories =
    adoption.categorySummary.length > 0
      ? adoption.categorySummary.map((c) => ({
          label: c.label,
          enabled: c.enabled,
          total: c.total,
        }))
      : []

  const total = adoption.prdData.length
  if (total > 0) {
    const enabled = adoption.prdData.filter((f) => f.enabled).length
    return {
      rate: Math.round((enabled / total) * 100),
      enabled,
      total,
      disabled: total - enabled,
      categories,
      fullyAdoptedCategories: categories.filter((c) => c.enabled === c.total).length,
    }
  }
  if (tenant) {
    return {
      rate: tenant.featureAdoption,
      enabled: 0,
      total: 0,
      disabled: 0,
      categories,
      fullyAdoptedCategories: categories.filter((c) => c.enabled === c.total).length,
    }
  }
  const featureCategories = adoption.featureAdoptionData
  const all = [
    ...featureCategories.infrastructure,
    ...featureCategories.services,
    ...featureCategories.tenantSettings,
    ...featureCategories.globalSettings,
  ]
  if (all.length === 0) {
    return { rate: 0, enabled: 0, total: 0, disabled: 0, categories, fullyAdoptedCategories: 0 }
  }
  const enabled = all.filter((f) => f.enabled).length
  return {
    rate: Math.round((enabled / all.length) * 100),
    enabled,
    total: all.length,
    disabled: all.length - enabled,
    categories,
    fullyAdoptedCategories: categories.filter((c) => c.enabled === c.total).length,
  }
}

export function deviceStatusLabel(status: PortalDevice["status"]): string {
  if (status === "up-to-date") return "Healthy"
  if (status === "update-critical") return "Critical"
  return "Update needed"
}
