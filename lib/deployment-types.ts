import { z } from "zod"

export const serverRoleSchema = z.enum([
  "DB",
  "DBREP",
  "TOMCAT",
  "PREVIEW",
  "APP",
  "MESSAGING",
  "OTHER",
])

export const deploymentServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: serverRoleSchema,
  installedVersion: z.string(),
  latestVersion: z.string().optional(),
  uptime: z.string(),
  status: z.enum(["online", "offline", "degraded"]).default("online"),
  ipAddress: z.string().optional(),
})

export const deploymentEdgeFilerSchema = z.object({
  id: z.string(),
  name: z.string(),
  installedVersion: z.string(),
  latestVersion: z.string().optional(),
  uptime: z.string(),
  status: z.enum(["online", "offline", "degraded"]).default("online"),
  location: z.string().optional(),
  macAddress: z.string().optional(),
})

export const deploymentAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.enum(["Windows", "macOS", "Linux"]).default("Windows"),
  installedVersion: z.string(),
  latestVersion: z.string().optional(),
  uptime: z.string(),
  status: z.enum(["online", "offline"]).default("online"),
  lastSeen: z.string().optional(),
})

export const upgradeHistoryEntrySchema = z.object({
  id: z.string(),
  targetType: z.enum(["server", "edge-filer", "agent"]),
  targetName: z.string(),
  fromVersion: z.string(),
  toVersion: z.string(),
  completedAt: z.string(),
  status: z.enum(["success", "failed", "in-progress"]),
  initiatedBy: z.string().optional(),
})

export const edgeFeatureAdoptionSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  features: z.array(
    z.object({
      name: z.string(),
      enabled: z.boolean(),
      description: z.string().optional(),
    }),
  ),
})

export const dbOverviewSchema = z.object({
  placeholder: z.literal(true).default(true),
  summary: z.string().optional(),
})

export type DeploymentServer = z.infer<typeof deploymentServerSchema>
export type DeploymentEdgeFiler = z.infer<typeof deploymentEdgeFilerSchema>
export type DeploymentAgent = z.infer<typeof deploymentAgentSchema>
export type UpgradeHistoryEntry = z.infer<typeof upgradeHistoryEntrySchema>
export type EdgeFeatureAdoption = z.infer<typeof edgeFeatureAdoptionSchema>
