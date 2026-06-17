import type { SeedHubData } from "@/lib/seed-hub"

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
