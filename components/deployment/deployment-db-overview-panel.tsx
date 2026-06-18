"use client"

import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"
import { effectiveDbOverview } from "@/lib/deployment-hub-views"

export function DeploymentDbOverviewPanel() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const db = effectiveDbOverview(hub, scope)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-[15px] font-semibold">DB overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <p className="text-[13px] font-medium text-foreground">Coming soon</p>
          <p className="mt-2 max-w-md text-[13px] text-muted-foreground">
            {db.summary ?? "Database size, replication lag, connection pool, and backup status will be shown here."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
