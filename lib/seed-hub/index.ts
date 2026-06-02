import { seedCurrentUser } from "./parts/current-user"
import { seedDashboard } from "./parts/dashboard"
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

/** Default hub document (v1). Used when `data/hub.json` is missing and as the POST validation contract baseline. */
export const seedHubData = {
  version: 1 as const,
  tenants: seedTenants,
  currentUser: seedCurrentUser,
  dashboard: seedDashboard,
  portal: seedPortal,
  insights: seedInsights,
  devices: seedDevicesPage,
  peerReview: seedPeerReview,
  featureAdoption: seedFeatureAdoption,
  downloads: seedDownloads,
  /** Per-tenant overlays (e.g. feature inventory imported for a portal). Keyed by `tenant.id`. */
  tenantSpaces: {} as Record<string, TenantSpacePayload>,
}

export type SeedHubData = typeof seedHubData
