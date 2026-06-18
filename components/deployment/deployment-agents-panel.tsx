"use client"

import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { InfrastructureTable, StatusDot, VersionCell } from "@/components/deployment/infrastructure-table"
import { effectiveDeploymentAgents } from "@/lib/deployment-hub-views"

export function DeploymentAgentsPanel() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const agents = effectiveDeploymentAgents(hub, scope)

  return (
    <InfrastructureTable
      title="Agents"
      rows={agents}
      emptyMessage="No agents for this deployment."
      columns={[
        { key: "name", header: "Endpoint", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "platform", header: "Platform", render: (r) => r.platform },
        { key: "version", header: "Version", render: (r) => <VersionCell installed={r.installedVersion} latest={r.latestVersion} /> },
        { key: "uptime", header: "Uptime", render: (r) => <span className="tabular-nums text-muted-foreground">{r.uptime}</span> },
        { key: "status", header: "Status", render: (r) => <StatusDot status={r.status} /> },
        { key: "lastSeen", header: "Last seen", render: (r) => <span className="text-[12px] text-muted-foreground">{r.lastSeen ? new Date(r.lastSeen).toLocaleString() : "—"}</span> },
      ]}
    />
  )
}
