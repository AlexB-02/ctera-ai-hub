"use client"

import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { effectiveUpgradeHistory } from "@/lib/deployment-hub-views"

export function DeploymentUpgradeHistoryPanel() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const history = effectiveUpgradeHistory(hub, scope)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-[15px] font-semibold">Upgrade history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No upgrades recorded for this deployment.</p>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
            >
              <div>
                <div className="text-[13px] font-medium text-foreground">
                  {entry.targetName}{" "}
                  <span className="font-normal text-muted-foreground">({entry.targetType.replace("-", " ")})</span>
                </div>
                <div className="mt-1 font-mono text-[12px] text-muted-foreground">
                  {entry.fromVersion} → {entry.toVersion}
                </div>
                {entry.initiatedBy && (
                  <div className="mt-1 text-[11px] text-muted-foreground">By {entry.initiatedBy}</div>
                )}
              </div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={
                    entry.status === "success"
                      ? "text-emerald-700 border-emerald-200"
                      : entry.status === "failed"
                        ? "text-red-700 border-red-200"
                        : "text-amber-700 border-amber-200"
                  }
                >
                  {entry.status}
                </Badge>
                <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                  {new Date(entry.completedAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
