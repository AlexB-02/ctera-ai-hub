import type { HubScope } from "@/lib/hub-scope"
import type { SeedHubData } from "@/lib/seed-hub"
import type { HubResponsePayload } from "@/lib/hub-types"
import type { DeploymentSpacePayload } from "@/lib/seed-hub/parts/deployment-spaces"
import type { Customer, Deployment } from "@/lib/customer-schema"
import {
  FEATURES_ONLY_EMPTY_DASHBOARD,
  FEATURES_ONLY_EMPTY_PORTAL,
} from "@/lib/hub-view-defaults"

export type DeploymentScope = HubScope

export function deploymentSpace(
  hub: HubResponsePayload,
  deploymentId: string,
): DeploymentSpacePayload | undefined {
  return hub.deploymentSpaces?.[deploymentId] ?? hub.tenantSpaces?.[deploymentId]
}

export function effectiveDeploymentPortal(
  hub: HubResponsePayload,
  scope: DeploymentScope,
): SeedHubData["portal"] {
  if (scope.type === "global") return hub.portal
  const space = deploymentSpace(hub, scope.deployment.id)
  if (space?.portal) return space.portal
  if (space?.featureAdoption) return FEATURES_ONLY_EMPTY_PORTAL
  return hub.portal
}

export function effectiveDeploymentDashboard(
  hub: HubResponsePayload,
  scope: DeploymentScope,
): SeedHubData["dashboard"] {
  if (scope.type === "global") return hub.dashboard
  const space = deploymentSpace(hub, scope.deployment.id)
  if (space && !space.portal) {
    return {
      ...FEATURES_ONLY_EMPTY_DASHBOARD,
      latestNewsItems: hub.dashboard.latestNewsItems?.length
        ? hub.dashboard.latestNewsItems
        : FEATURES_ONLY_EMPTY_DASHBOARD.latestNewsItems,
    }
  }
  return hub.dashboard
}

export function effectiveDeploymentFeatureAdoption(
  hub: HubResponsePayload,
  scope: DeploymentScope,
): SeedHubData["featureAdoption"] {
  if (scope.type === "global") return hub.featureAdoption
  const space = deploymentSpace(hub, scope.deployment.id)
  if (space?.featureAdoption) return space.featureAdoption
  return hub.featureAdoption
}

export function effectiveDeploymentServers(hub: HubResponsePayload, scope: DeploymentScope) {
  if (scope.type === "global") return []
  return deploymentSpace(hub, scope.deployment.id)?.servers ?? []
}

export function effectiveDeploymentEdgeFilers(hub: HubResponsePayload, scope: DeploymentScope) {
  if (scope.type === "global") return []
  return deploymentSpace(hub, scope.deployment.id)?.edgeFilers ?? []
}

export function effectiveDeploymentAgents(hub: HubResponsePayload, scope: DeploymentScope) {
  if (scope.type === "global") return []
  return deploymentSpace(hub, scope.deployment.id)?.agents ?? []
}

export function effectiveUpgradeHistory(hub: HubResponsePayload, scope: DeploymentScope) {
  if (scope.type === "global") return []
  return deploymentSpace(hub, scope.deployment.id)?.upgradeHistory ?? []
}

export function effectiveDbOverview(hub: HubResponsePayload, scope: DeploymentScope) {
  if (scope.type === "global") return { placeholder: true as const, summary: undefined }
  return (
    deploymentSpace(hub, scope.deployment.id)?.dbOverview ?? {
      placeholder: true as const,
      summary: "Database metrics and replication health will appear here.",
    }
  )
}

export function effectiveEdgeFeatureAdoption(hub: HubResponsePayload, scope: DeploymentScope) {
  if (scope.type === "global") return []
  return deploymentSpace(hub, scope.deployment.id)?.edgeFeatureAdoption ?? []
}

export function deploymentUsesFeaturesOnlyViews(hub: HubResponsePayload, scope: DeploymentScope): boolean {
  if (scope.type === "global") return false
  const space = deploymentSpace(hub, scope.deployment.id)
  return !!(space?.featureAdoption && !space?.portal)
}

/** @deprecated Use DeploymentScope — kept for pages still on tenant scope during migration */
export function scopeFromLegacyTenant(
  customer: Customer,
  deployment: Deployment,
): DeploymentScope {
  return { type: "deployment", customer, deployment }
}
