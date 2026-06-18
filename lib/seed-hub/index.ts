import { seedCurrentUser } from "./parts/current-user"
import { seedCustomers } from "./parts/customers"
import { seedDashboard } from "./parts/dashboard"
import { seedDeployments } from "./parts/deployments"
import { seedDeploymentSpaces, type DeploymentSpacePayload } from "./parts/deployment-spaces"
import { seedDevicesPage } from "./parts/devices-page"
import { seedDownloads } from "./parts/downloads"
import { seedFeatureAdoption } from "./parts/feature-adoption"
import { seedInsights } from "./parts/insights"
import { seedPeerReview } from "./parts/peer-review"
import { seedPortal } from "./parts/portal"
import { seedTenants } from "./parts/tenants"

export type TenantSpacePayload = {
  featureAdoption?: typeof seedFeatureAdoption
}

export type { DeploymentSpacePayload }

/** Default hub document (v1). Used when `data/hub.json` is missing and as the POST validation contract baseline. */
export const seedHubData = {
  version: 1 as const,
  tenants: seedTenants,
  customers: seedCustomers,
  deployments: seedDeployments,
  currentUser: seedCurrentUser,
  dashboard: seedDashboard,
  portal: seedPortal,
  insights: seedInsights,
  devices: seedDevicesPage,
  peerReview: seedPeerReview,
  featureAdoption: seedFeatureAdoption,
  downloads: seedDownloads,
  /** Per-deployment infrastructure, adoption, and portal overlay. Keyed by `deployment.id`. */
  deploymentSpaces: seedDeploymentSpaces as Record<string, DeploymentSpacePayload>,
  /** @deprecated Use deploymentSpaces — kept for legacy imports */
  tenantSpaces: {} as Record<string, TenantSpacePayload>,
}

export type SeedHubData = typeof seedHubData
