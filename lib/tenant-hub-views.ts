import type { HubScope } from "@/lib/hub-scope"
import type { SeedHubData } from "@/lib/seed-hub"
import type { HubResponsePayload } from "@/lib/hub-types"
import type { Tenant } from "@/lib/hub-schema"
import {
  deploymentUsesFeaturesOnlyViews,
  effectiveDeploymentDashboard,
  effectiveDeploymentFeatureAdoption,
  effectiveDeploymentPortal,
} from "@/lib/deployment-hub-views"

export {
  EMPTY_FEATURE_ADOPTION,
  FEATURES_ONLY_EMPTY_DASHBOARD,
  FEATURES_ONLY_EMPTY_PORTAL,
} from "@/lib/hub-view-defaults"

export function tenantUsesFeaturesOnlyViews(tenant: Tenant): boolean {
  return tenant.contentProfile === "features-only"
}

export { deploymentUsesFeaturesOnlyViews }

export function effectiveDashboard(hub: HubResponsePayload, scope: HubScope): SeedHubData["dashboard"] {
  return effectiveDeploymentDashboard(hub, scope)
}

export function effectivePortal(hub: HubResponsePayload, scope: HubScope): SeedHubData["portal"] {
  return effectiveDeploymentPortal(hub, scope)
}

export function effectiveFeatureAdoption(hub: HubResponsePayload, scope: HubScope): SeedHubData["featureAdoption"] {
  return effectiveDeploymentFeatureAdoption(hub, scope)
}
