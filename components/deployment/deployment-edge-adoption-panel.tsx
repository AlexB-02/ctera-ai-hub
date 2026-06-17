"use client"

import { useState } from "react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { effectiveEdgeFeatureAdoption } from "@/lib/deployment-hub-views"
import { cn } from "@/lib/utils"

export function DeploymentEdgeAdoptionPanel() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const devices = effectiveEdgeFeatureAdoption(hub, scope)
  const [selectedId, setSelectedId] = useState(devices[0]?.deviceId ?? "")

  const selected = devices.find((d) => d.deviceId === selectedId) ?? devices[0]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <CardTitle className="text-[15px] font-semibold">Edge device feature adoption</CardTitle>
          <div className="space-y-1.5 min-w-[14rem]">
            <Label htmlFor="edge-device-select" className="text-[12px]">
              Edge Filer
            </Label>
            <Select value={selected?.deviceId ?? ""} onValueChange={setSelectedId}>
              <SelectTrigger id="edge-device-select" className="h-9 text-sm">
                <SelectValue placeholder="Select Edge Filer" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.deviceId} value={d.deviceId}>
                    {d.deviceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selected || selected.features.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No edge feature data for this deployment.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {selected.features.map((f) => (
              <div
                key={f.name}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5",
                  f.enabled ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-muted/20",
                )}
              >
                <span className="text-[13px] font-medium">{f.name}</span>
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-wide",
                    f.enabled ? "text-emerald-700" : "text-muted-foreground",
                  )}
                >
                  {f.enabled ? "On" : "Off"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
