import type { SeedHubData } from "@/lib/seed-hub"
import type { HubResponsePayload } from "@/lib/hub-types"
import type { Tenant } from "@/lib/hub-schema"

export const EMPTY_FEATURE_ADOPTION: SeedHubData["featureAdoption"] = {
  featureAdoptionData: {
    infrastructure: [],
    services: [],
    tenantSettings: [],
    globalSettings: [],
  },
  prdData: [],
  categorySummary: [],
}

export const FEATURES_ONLY_EMPTY_DASHBOARD: SeedHubData["dashboard"] = {
  myCteraSpaceLastUpdated: "—",
  latestVersions: [],
  newsItems: [],
  latestNewsItems: [],
}

export const FEATURES_ONLY_EMPTY_PORTAL: SeedHubData["portal"] = {
  devices: [],
  latestVersions: [],
  recommendations: [],
  featureAdoptionData: {
    infrastructure: [],
    services: [],
    tenantSettings: [],
    globalSettings: [],
  },
}

export function tenantUsesFeaturesOnlyViews(tenant: Tenant): boolean {
  return tenant.contentProfile === "features-only"
}

type TenantScope =
  | { type: "global" }
  | { type: "tenant"; tenant: Tenant }

export function effectiveDashboard(hub: HubResponsePayload, scope: TenantScope): SeedHubData["dashboard"] {
  if (scope.type === "tenant" && tenantUsesFeaturesOnlyViews(scope.tenant)) {
    return {
      ...FEATURES_ONLY_EMPTY_DASHBOARD,
      latestNewsItems:
        hub.dashboard.latestNewsItems?.length > 0
          ? hub.dashboard.latestNewsItems
          : FEATURES_ONLY_EMPTY_DASHBOARD.latestNewsItems,
    }
  }
  return hub.dashboard
}

export function effectivePortal(hub: HubResponsePayload, scope: TenantScope): SeedHubData["portal"] {
  if (scope.type === "tenant" && tenantUsesFeaturesOnlyViews(scope.tenant)) {
    return FEATURES_ONLY_EMPTY_PORTAL
  }
  return hub.portal
}

export function effectiveFeatureAdoption(
  hub: HubResponsePayload,
  scope: TenantScope,
): SeedHubData["featureAdoption"] {
  if (scope.type === "global") {
    return hub.featureAdoption
  }
  const id = scope.tenant.id
  const space = hub.tenantSpaces?.[id]
  if (space?.featureAdoption) {
    return space.featureAdoption
  }
  if (tenantUsesFeaturesOnlyViews(scope.tenant)) {
    return EMPTY_FEATURE_ADOPTION
  }
  return hub.featureAdoption
}
