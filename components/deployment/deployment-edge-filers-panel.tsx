"use client"

import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { InfrastructureTable, StatusDot, VersionCell } from "@/components/deployment/infrastructure-table"
import { effectiveDeploymentEdgeFilers } from "@/lib/deployment-hub-views"

export function DeploymentEdgeFilersPanel() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const edgeFilers = effectiveDeploymentEdgeFilers(hub, scope)

  return (
    <InfrastructureTable
      title="Edge Filers"
      rows={edgeFilers}
      emptyMessage="No Edge Filers for this deployment."
      columns={[
        { key: "name", header: "Device", render: (r) => <span className="font-medium">{r.name}</span> },
        { key: "location", header: "Location", render: (r) => <span className="text-muted-foreground">{r.location ?? "—"}</span> },
        { key: "version", header: "Version", render: (r) => <VersionCell installed={r.installedVersion} latest={r.latestVersion} /> },
        { key: "uptime", header: "Uptime", render: (r) => <span className="tabular-nums text-muted-foreground">{r.uptime}</span> },
        { key: "status", header: "Status", render: (r) => <StatusDot status={r.status} /> },
        { key: "mac", header: "MAC", render: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.macAddress ?? "—"}</span> },
      ]}
    />
  )
}
