"use client"

import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { InfrastructureTable, StatusDot, VersionCell } from "@/components/deployment/infrastructure-table"
import { effectiveDeploymentServers } from "@/lib/deployment-hub-views"

export function DeploymentServersPanel() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const servers = effectiveDeploymentServers(hub, scope)

  return (
    <InfrastructureTable
      title="Portal servers"
      rows={servers}
      emptyMessage="No servers for this deployment."
      columns={[
        { key: "name", header: "Server", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "role", header: "Role", render: (r) => <span className="font-mono text-[12px]">{r.role}</span> },
        { key: "version", header: "Version", render: (r) => <VersionCell installed={r.installedVersion} latest={r.latestVersion} /> },
        { key: "uptime", header: "Uptime", render: (r) => <span className="tabular-nums text-muted-foreground">{r.uptime}</span> },
        { key: "status", header: "Status", render: (r) => <StatusDot status={r.status} /> },
        { key: "ip", header: "IP", render: (r) => <span className="font-mono text-[12px] text-muted-foreground">{r.ipAddress ?? "—"}</span> },
      ]}
    />
  )
}
