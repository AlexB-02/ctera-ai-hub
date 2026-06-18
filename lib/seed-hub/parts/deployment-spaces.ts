import type {
  DeploymentAgent,
  DeploymentEdgeFiler,
  DeploymentServer,
  EdgeFeatureAdoption,
  UpgradeHistoryEntry,
} from "@/lib/deployment-types"
import { seedFeatureAdoption } from "./feature-adoption"
import { seedPortal } from "./portal"

export type DeploymentSpacePayload = {
  servers?: DeploymentServer[]
  edgeFilers?: DeploymentEdgeFiler[]
  agents?: DeploymentAgent[]
  upgradeHistory?: UpgradeHistoryEntry[]
  dbOverview?: { placeholder: true; summary?: string }
  edgeFeatureAdoption?: EdgeFeatureAdoption[]
  featureAdoption?: typeof seedFeatureAdoption
  portal?: typeof seedPortal
}

const defaultServers: DeploymentServer[] = [
  { id: "srv-db", name: "DB-01", role: "DB", installedVersion: "8.3.4075", latestVersion: "8.3.4075", uptime: "42d 6h", status: "online", ipAddress: "10.0.1.10" },
  { id: "srv-dbrep", name: "DBREP-01", role: "DBREP", installedVersion: "8.3.4075", latestVersion: "8.3.4075", uptime: "42d 6h", status: "online", ipAddress: "10.0.1.11" },
  { id: "srv-tomcat1", name: "TOMCAT1", role: "TOMCAT", installedVersion: "8.3.4075", latestVersion: "8.3.4075", uptime: "18d 2h", status: "online", ipAddress: "10.0.1.20" },
  { id: "srv-tomcat2", name: "TOMCAT2", role: "TOMCAT", installedVersion: "8.3.3000", latestVersion: "8.3.4075", uptime: "18d 2h", status: "degraded", ipAddress: "10.0.1.21" },
  { id: "srv-preview", name: "PREVIEW-01", role: "PREVIEW", installedVersion: "8.3.4075", latestVersion: "8.3.4075", uptime: "30d 12h", status: "online", ipAddress: "10.0.1.30" },
]

const defaultEdgeFilers: DeploymentEdgeFiler[] = [
  { id: "edge-uk-1", name: "Operations UK", installedVersion: "21.5.19.439", latestVersion: "25.5.19.439", uptime: "14d 8h", status: "online", location: "London, UK", macAddress: "00:1A:2B:3C:4D:01" },
  { id: "edge-uk-2", name: "Operations UK 2", installedVersion: "21.5.19.439", latestVersion: "25.5.19.439", uptime: "9d 3h", status: "degraded", location: "Manchester, UK", macAddress: "00:1A:2B:3C:4D:02" },
  { id: "edge-us-1", name: "Central Office US", installedVersion: "25.5.19.439", latestVersion: "25.5.19.439", uptime: "60d 1h", status: "online", location: "Chicago, US", macAddress: "00:1A:2B:3C:4D:03" },
]

const defaultAgents: DeploymentAgent[] = [
  { id: "agent-win-1", name: "FIN-WS-042", platform: "Windows", installedVersion: "7.0.50", latestVersion: "7.0.52", uptime: "5d 4h", status: "online", lastSeen: "2026-06-07T08:12:00Z" },
  { id: "agent-mac-1", name: "DESIGN-MBP-07", platform: "macOS", installedVersion: "7.0.52", latestVersion: "7.0.52", uptime: "12d 0h", status: "online", lastSeen: "2026-06-07T07:55:00Z" },
  { id: "agent-lin-1", name: "DEV-BUILD-03", platform: "Linux", installedVersion: "7.0.48", latestVersion: "7.0.52", uptime: "22d 18h", status: "offline", lastSeen: "2026-06-05T14:30:00Z" },
]

const defaultUpgradeHistory: UpgradeHistoryEntry[] = [
  { id: "upg-1", targetType: "server", targetName: "TOMCAT2", fromVersion: "8.3.2800", toVersion: "8.3.3000", completedAt: "2026-05-15T22:00:00Z", status: "success", initiatedBy: "admin" },
  { id: "upg-2", targetType: "edge-filer", targetName: "Operations UK", fromVersion: "20.4.19.439", toVersion: "21.5.19.439", completedAt: "2026-04-02T03:15:00Z", status: "success", initiatedBy: "support" },
  { id: "upg-3", targetType: "agent", targetName: "FIN-WS-042", fromVersion: "7.0.48", toVersion: "7.0.50", completedAt: "2026-06-01T11:00:00Z", status: "success", initiatedBy: "auto-update" },
]

const defaultEdgeAdoption: EdgeFeatureAdoption[] = [
  {
    deviceId: "edge-uk-1",
    deviceName: "Operations UK",
    features: [
      { name: "Cloud Drive Sync", enabled: true },
      { name: "Antivirus Scan", enabled: true },
      { name: "Global File Lock", enabled: false },
      { name: "Varonis Integration", enabled: true },
      { name: "SMB Multichannel", enabled: false },
    ],
  },
  {
    deviceId: "edge-uk-2",
    deviceName: "Operations UK 2",
    features: [
      { name: "Cloud Drive Sync", enabled: true },
      { name: "Antivirus Scan", enabled: false },
      { name: "Global File Lock", enabled: false },
      { name: "Varonis Integration", enabled: false },
      { name: "SMB Multichannel", enabled: true },
    ],
  },
  {
    deviceId: "edge-us-1",
    deviceName: "Central Office US",
    features: [
      { name: "Cloud Drive Sync", enabled: true },
      { name: "Antivirus Scan", enabled: true },
      { name: "Global File Lock", enabled: true },
      { name: "Varonis Integration", enabled: true },
      { name: "SMB Multichannel", enabled: true },
    ],
  },
]

function makeSpace(overrides?: Partial<DeploymentSpacePayload>): DeploymentSpacePayload {
  return {
    servers: defaultServers,
    edgeFilers: defaultEdgeFilers,
    agents: defaultAgents,
    upgradeHistory: defaultUpgradeHistory,
    dbOverview: { placeholder: true, summary: "Database metrics and replication health will appear here." },
    edgeFeatureAdoption: defaultEdgeAdoption,
    featureAdoption: seedFeatureAdoption,
    portal: seedPortal,
    ...overrides,
  }
}

/** Per-deployment infrastructure and adoption data keyed by deployment.id */
export const seedDeploymentSpaces: Record<string, DeploymentSpacePayload> = {
  "acme-eu": makeSpace(),
  "acme-us": makeSpace({
    servers: defaultServers.map((s) => ({ ...s, id: `us-${s.id}`, installedVersion: s.installedVersion })),
  }),
  "wayne-primary": makeSpace(),
  "wayne-eu": makeSpace(),
  "globex-us": makeSpace(),
  "globex-research": makeSpace({ edgeFilers: defaultEdgeFilers.slice(0, 1) }),
  "customer-prod": makeSpace(),
  "initech-prod": makeSpace(),
  "umbrella-prod": makeSpace(),
  "stark-prod": makeSpace(),
  "soylent-trial": makeSpace({ upgradeHistory: [] }),
  "hooli-prod": makeSpace(),
  "pied-piper-prod": makeSpace(),
  "cyberdyne-prod": makeSpace(),
  "tyrell-prod": makeSpace(),
}
