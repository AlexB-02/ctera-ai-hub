"use client"

import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { FileText } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { getDeviceIcon } from "@/lib/lucide-icon-map"

export default function DevicesPage() {
  const { hub } = useHub()
  const { devices: deviceRows } = hub.devices

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <TopBar title="Devices" subtitle="Status and versions across all CTERA devices" />

        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {deviceRows.map((device, index) => {
              const DeviceIcon = getDeviceIcon(
                "icon" in device ? (device as { icon?: string }).icon : undefined,
              )
              return (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <DeviceIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{device.type}</div>
                          <div className="font-display text-lg font-bold text-primary">{device.name}</div>
                        </div>
                      </div>
                      <StatusBadge status={device.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{device.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Latest Version:</div>
                        <div className="font-medium">{device.latestVersion}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Installed Version:</div>
                        <div className="font-medium">
                          <span className={device.status === "up-to-date" ? "text-success" : "text-warning"}>
                            {device.installedVersion}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">Last Update:</div>
                      <div className="font-medium">{device.lastUpdate}</div>
                    </div>
                    {device.status !== "up-to-date" && <Button className="w-full">Update Device</Button>}
                    <Button variant="outline" className="w-full bg-transparent">
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
