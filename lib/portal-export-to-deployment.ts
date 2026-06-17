import type { Customer, Deployment } from "@/lib/customer-schema"
import type { DeploymentAgent, DeploymentEdgeFiler, DeploymentServer } from "@/lib/deployment-types"
import type { Tenant } from "@/lib/hub-schema"
import type { DeploymentSpacePayload } from "@/lib/seed-hub/parts/deployment-spaces"
import {
  featureAdoptionFromPortalExport,
  tenantFromPortalExport,
} from "@/lib/portal-export-to-tenant"

type PortalExport = {
  exportedAt?: string
  portalDnsSuffix?: string
  features?: Record<string, { name: string; data?: unknown }[]>
  deviceList?: unknown[]
}

function slugFromName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "customer"
  )
}

function customerNameFromDns(dns: string): string {
  const host = dns.split(".")[0] ?? dns
  return host.charAt(0).toUpperCase() + host.slice(1)
}

function inferServerRole(name: string): DeploymentServer["role"] {
  const n = name.toUpperCase()
  if (n.includes("DBREP") || n.includes("REPLICA")) return "DBREP"
  if (n.includes("PREVIEW")) return "PREVIEW"
  if (n.includes("TOMCAT") || n.includes("APP")) return "TOMCAT"
  if (n.includes("DB") || n.includes("DATABASE")) return "DB"
  if (n.includes("MESSAGING")) return "MESSAGING"
  return "OTHER"
}

function versionFromData(data: unknown): string {
  if (!data || typeof data !== "object") return "—"
  const o = data as Record<string, unknown>
  for (const key of ["version", "installedVersion", "portalVersion", "build"]) {
    const v = o[key]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return "—"
}

function serversFromInfrastructure(exportDoc: PortalExport): DeploymentServer[] {
  const infra = exportDoc.features?.Infrastructure ?? []
  const servers: DeploymentServer[] = []
  for (const item of infra) {
    const role = inferServerRole(item.name)
    if (role === "OTHER" && !/server|tomcat|db|preview/i.test(item.name)) continue
    const id = slugFromName(item.name)
    servers.push({
      id: `srv-${id}`,
      name: item.name.replace(/^Portal Server\s*/i, "").trim() || item.name,
      role,
      installedVersion: versionFromData(item.data),
      uptime: "—",
      status: "online",
    })
  }
  return servers
}

function devicesFromExport(exportDoc: PortalExport): {
  edgeFilers: DeploymentEdgeFiler[]
  agents: DeploymentAgent[]
} {
  const edgeFilers: DeploymentEdgeFiler[] = []
  const agents: DeploymentAgent[] = []
  const list = Array.isArray(exportDoc.deviceList) ? exportDoc.deviceList : []

  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue
    const d = raw as Record<string, unknown>
    const name = String(d.name ?? d.deviceName ?? d.hostname ?? "Device")
    const type = String(d.type ?? d.deviceType ?? "").toLowerCase()
    const id = slugFromName(name)
    const version = String(d.version ?? d.installedVersion ?? "—")
    const uptime = String(d.uptime ?? "—")

    if (type.includes("edge") || type.includes("filer") || type.includes("v-gateway")) {
      edgeFilers.push({
        id: `edge-${id}`,
        name,
        installedVersion: version,
        uptime,
        status: "online",
        location: typeof d.location === "string" ? d.location : undefined,
      })
    } else if (type.includes("agent") || type.includes("drive") || type.includes("client")) {
      const platformRaw = String(d.platform ?? d.os ?? "Windows")
      const platform: DeploymentAgent["platform"] =
        /mac/i.test(platformRaw) ? "macOS" : /linux/i.test(platformRaw) ? "Linux" : "Windows"
      agents.push({
        id: `agent-${id}`,
        name,
        platform,
        installedVersion: version,
        uptime,
        status: "online",
        lastSeen: typeof d.lastSeen === "string" ? d.lastSeen : undefined,
      })
    }
  }

  return { edgeFilers, agents }
}

export function customerFromPortalExport(
  exportDoc: PortalExport,
  options?: { portalName?: string },
): Customer {
  const tenant = tenantFromPortalExport(exportDoc, options)
  const dns = exportDoc.portalDnsSuffix?.trim() || tenant.domain
  const customerId = slugFromName(dns.split(".")[0] ?? tenant.name)

  return {
    id: customerId,
    name: customerNameFromDns(dns),
    region: tenant.region,
    plan: tenant.plan,
    status: tenant.status,
    users: tenant.users,
    storage: tenant.storage,
    featureAdoption: tenant.featureAdoption,
  }
}

export function deploymentFromPortalExport(
  exportDoc: PortalExport,
  customerId: string,
  options?: { portalName?: string },
): Deployment {
  const tenant = tenantFromPortalExport(exportDoc, options)
  const dns = exportDoc.portalDnsSuffix?.trim() || tenant.domain
  const deploymentId = slugFromName(dns)

  return {
    id: deploymentId,
    customerId,
    name: options?.portalName?.trim() || customerNameFromDns(dns),
    dnsSuffix: dns,
    region: tenant.region,
    status: tenant.status,
  }
}

export function deploymentSpaceFromPortalExport(exportDoc: PortalExport): DeploymentSpacePayload {
  const featureAdoption = featureAdoptionFromPortalExport(exportDoc)
  const { edgeFilers, agents } = devicesFromExport(exportDoc)
  const servers = serversFromInfrastructure(exportDoc)

  return {
    featureAdoption,
    servers,
    edgeFilers,
    agents,
    upgradeHistory: [],
    dbOverview: { placeholder: true, summary: "Database metrics and replication health will appear here." },
    edgeFeatureAdoption: edgeFilers.map((e) => ({
      deviceId: e.id,
      deviceName: e.name,
      features: [],
    })),
  }
}

/** Legacy tenant row for admin tables still keyed on tenants[]. */
export function legacyTenantFromPortalExport(
  exportDoc: PortalExport,
  options?: { portalName?: string },
): Tenant {
  const tenant = tenantFromPortalExport(exportDoc, options)
  return { ...tenant, contentProfile: "features-only" }
}
