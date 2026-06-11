"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowRight, Download, ExternalLink, Loader2, MapPin, Plus, Search } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import Link from "next/link"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { getDashboardVersionIcon } from "@/lib/lucide-icon-map"
import { effectivePortal } from "@/lib/tenant-hub-views"
import type { PortalDevice } from "@/components/deployment-locations-map"
import dynamic from "next/dynamic"

const DeploymentLocationsMap = dynamic(
  () =>
    import("@/components/deployment-locations-map").then((mod) => ({
      default: mod.DeploymentLocationsMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(420px,55vh)] items-center justify-center rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
)

type StoredLocationOverride = { lat: number; lng: number; label?: string }

const DEVICE_TYPES: PortalDevice["type"][] = [
  "CTERA Portal",
  "CTERA Edge Filer",
  "CTERA Drive",
]

function DeviceRowActions({
  device,
  onOpenLocationEditor,
}: {
  device: PortalDevice
  onOpenLocationEditor: (device: PortalDevice) => void
}) {
  return (
    <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onOpenLocationEditor(device)}
      >
        <MapPin className="mr-1.5 h-3.5 w-3.5" />
        Set location
      </Button>
      <Button asChild size="sm" variant="secondary">
        <Link href="/downloads">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Get latest version
        </Link>
      </Button>
    </div>
  )
}

export default function DeploymentOverview() {
  const { hub } = useHub()
  const { scope } = useTenant()
  const { devices, latestVersions } = effectivePortal(hub, scope)
  const scopeKey = scope.type === "global" ? "__global" : scope.tenant.id

  const manualStorageKey = `ctera-hub/deployment-manual-devices/v1/${scopeKey}`
  const overrideStorageKey = `ctera-hub/deployment-location-overrides/v1/${scopeKey}`

  const [manualDevices, setManualDevices] = useState<PortalDevice[]>([])
  const [locationOverrides, setLocationOverrides] = useState<Record<string, StoredLocationOverride>>({})
  const [locationEditor, setLocationEditor] = useState<PortalDevice | null>(null)
  const [placeQuery, setPlaceQuery] = useState("")
  const [geocodeResults, setGeocodeResults] = useState<{ lat: number; lng: number; displayName: string }[]>([])
  const [pickIndex, setPickIndex] = useState<number | null>(null)
  const [geocodeLoading, setGeocodeLoading] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState("")
  const [newDeviceType, setNewDeviceType] = useState<PortalDevice["type"]>("CTERA Portal")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(manualStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as PortalDevice[]
        setManualDevices(Array.isArray(parsed) ? parsed : [])
      } else {
        setManualDevices([])
      }
    } catch {
      setManualDevices([])
    }
  }, [manualStorageKey])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(overrideStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, StoredLocationOverride>
        setLocationOverrides(parsed && typeof parsed === "object" ? parsed : {})
      } else {
        setLocationOverrides({})
      }
    } catch {
      setLocationOverrides({})
    }
  }, [overrideStorageKey])

  const persistManual = useCallback(
    (next: PortalDevice[]) => {
      try {
        localStorage.setItem(manualStorageKey, JSON.stringify(next))
      } catch {
        /* ignore */
      }
    },
    [manualStorageKey],
  )

  const persistOverrides = useCallback(
    (next: Record<string, StoredLocationOverride>) => {
      try {
        localStorage.setItem(overrideStorageKey, JSON.stringify(next))
      } catch {
        /* ignore */
      }
    },
    [overrideStorageKey],
  )

  const addManualDevice = useCallback(
    (d: PortalDevice) => {
      setManualDevices((prev) => {
        const next = [...prev, d]
        persistManual(next)
        return next
      })
    },
    [persistManual],
  )

  const allDevices = useMemo(() => [...devices, ...manualDevices], [devices, manualDevices])

  const devicesWithLocations = useMemo(() => {
    return allDevices.map((d) => {
      const o = locationOverrides[String(d.id)]
      if (!o) return d
      return {
        ...d,
        lat: o.lat,
        lng: o.lng,
        location: o.label ?? `${o.lat.toFixed(2)}°, ${o.lng.toFixed(2)}°`,
      }
    })
  }, [allDevices, locationOverrides])

  useEffect(() => {
    if (!locationEditor) {
      setPlaceQuery("")
      setGeocodeResults([])
      setPickIndex(null)
      setGeocodeError(null)
      setGeocodeLoading(false)
      return
    }
    const loc = locationEditor.location
    if (loc && !loc.includes("Not placed")) {
      setPlaceQuery(loc)
    } else {
      setPlaceQuery("")
    }
    setGeocodeResults([])
    setPickIndex(null)
    setGeocodeError(null)
  }, [locationEditor])

  const applyPlacement = useCallback(
    (deviceId: number, lat: number, lng: number, placeLabel?: string) => {
      const coordLabel = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
      const locationLabel = placeLabel?.trim() ? placeLabel.trim() : coordLabel
      let updatedManual = false
      setManualDevices((prev) => {
        if (!prev.some((d) => d.id === deviceId)) return prev
        updatedManual = true
        const next = prev.map((d) =>
          d.id === deviceId ? { ...d, lat, lng, location: locationLabel } : d,
        )
        persistManual(next)
        return next
      })
      if (!updatedManual) {
        setLocationOverrides((prev) => {
          const entry: StoredLocationOverride = placeLabel?.trim()
            ? { lat, lng, label: placeLabel.trim() }
            : { lat, lng }
          const next = { ...prev, [String(deviceId)]: entry }
          persistOverrides(next)
          return next
        })
      }
      setLocationEditor(null)
    },
    [persistManual, persistOverrides],
  )

  const runGeocode = useCallback(async () => {
    const q = placeQuery.trim()
    if (q.length < 2) {
      setGeocodeError("Enter a place name, address, or city (at least 2 characters).")
      return
    }
    setGeocodeError(null)
    setGeocodeLoading(true)
    setGeocodeResults([])
    setPickIndex(null)
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const data = (await res.json()) as { results?: { lat: number; lng: number; displayName: string }[]; error?: string }
      if (!res.ok) {
        setGeocodeError(data.error ?? "Search failed")
        return
      }
      const list = data.results ?? []
      setGeocodeResults(list)
      setPickIndex(list.length > 0 ? 0 : null)
      if (list.length === 0) setGeocodeError("No matching places found. Try a different search.")
    } catch {
      setGeocodeError("Could not reach the geocoding service.")
    } finally {
      setGeocodeLoading(false)
    }
  }, [placeQuery])

  const confirmLocationFromDialog = useCallback(() => {
    if (!locationEditor || pickIndex == null || !geocodeResults[pickIndex]) return
    const hit = geocodeResults[pickIndex]
    applyPlacement(locationEditor.id, hit.lat, hit.lng, hit.displayName)
  }, [locationEditor, pickIndex, geocodeResults, applyPlacement])

  const confirmAddDevice = useCallback(() => {
    const id = -Date.now()
    addManualDevice({
      id,
      name: newDeviceName.trim() || "New device",
      type: newDeviceType,
      location: "Not placed — use Set location",
      latestVersion: "—",
      installedVersion: "—",
      status: "up-to-date",
      lastUpdate: "—",
      description: "Added manually; set location from the device row.",
      lat: 0,
      lng: 0,
    })
    setAddDeviceOpen(false)
    setNewDeviceName("")
    setNewDeviceType("CTERA Portal")
  }, [addManualDevice, newDeviceName, newDeviceType])

  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const tabCounts = useMemo(() => {
    const portals = devicesWithLocations.filter((d) => d.type === "CTERA Portal").length
    const edge = devicesWithLocations.filter((d) => d.type === "CTERA Edge Filer").length
    const drives = devicesWithLocations.filter((d) => d.type === "CTERA Drive").length
    const mobile = devicesWithLocations.filter((d) => /mobile/i.test(d.type)).length
    return { portals, edge, drives, mobile }
  }, [devicesWithLocations])

  const filteredDevices = useMemo(() => {
    return devicesWithLocations.filter((device) => {
      const matchesStatus = !statusFilter || device.status === statusFilter
      const matchesSearch =
        !searchQuery ||
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [statusFilter, searchQuery, devicesWithLocations])

  const emptyDeploymentHint =
    devicesWithLocations.length === 0
      ? "No deployment data for this tenant."
      : "No devices match your search or filter."

  const emptyCategoryHint =
    devicesWithLocations.length === 0 ? "No deployment data for this tenant." : "No devices in this category."

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Deployment Overview"
          subtitle={scope.type === "tenant" ? scope.tenant.domain : "All tenants"}
          actions={
            <Select defaultValue="portal-01">
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select Portal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portal-01">Portal 01</SelectItem>
                <SelectItem value="portal-02">Portal 02</SelectItem>
                <SelectItem value="portal-03">Portal 03</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <div className="p-8 space-y-6">

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Latest Versions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestVersions.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No version summary for this tenant.
                    </p>
                  ) : (
                    latestVersions.map((item) => {
                      const VIcon = getDashboardVersionIcon(
                        "icon" in item ? (item as { icon?: string }).icon : undefined,
                      )
                      return (
                        <div key={item.name} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <VIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.deviceCount} Devices</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.status} />
                            <Button variant="ghost" size="icon">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <Button variant="ghost" className="w-full text-primary">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View all download
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-xs text-muted-foreground">
                    OpenStreetMap — zoom and pan to explore. Device markers show status colors; click a marker for
                    details. To place or change a device, use{" "}
                    <span className="font-medium text-foreground">Set location</span> in the list and search for a real
                    place.
                  </p>
                  <DeploymentLocationsMap devices={devicesWithLocations} />
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all-devices">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="flex-wrap">
                  <TabsTrigger value="all-devices">All Devices</TabsTrigger>
                  <TabsTrigger value="portals">
                    Portals{" "}
                    <Badge variant="secondary" className="ml-2">
                      {tabCounts.portals}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="edge-filers">
                    Edge Filers{" "}
                    <Badge variant="secondary" className="ml-2">
                      {tabCounts.edge}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="cloud-drives">
                    Cloud Drives{" "}
                    <Badge variant="secondary" className="ml-2">
                      {tabCounts.drives}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="mobile-app">
                    Mobile App{" "}
                    <Badge variant="secondary" className="ml-2">
                      {tabCounts.mobile}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setAddDeviceOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add device
                  </Button>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search devices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <TabsContent value="all-devices" className="mt-6">
                {statusFilter && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filtered by:</span>
                    <Badge variant="secondary" className="capitalize">
                      {statusFilter.replace("-", " ")}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)}>
                      Clear filter
                    </Button>
                  </div>
                )}
                {filteredDevices.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">{emptyDeploymentHint}</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredDevices.map((device) => (
                      <Card key={device.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-lg font-semibold text-foreground">{device.name}</h3>
                                <Badge variant="outline">{device.type}</Badge>
                                <StatusBadge status={device.status} />
                              </div>
                              <p className="text-sm text-muted-foreground">{device.location}</p>
                            </div>
                            <DeviceRowActions device={device} onOpenLocationEditor={setLocationEditor} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="portals">
                {filteredDevices.filter((d) => d.type === "CTERA Portal").length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">{emptyCategoryHint}</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredDevices
                      .filter((d) => d.type === "CTERA Portal")
                      .map((device) => (
                        <Card key={device.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-lg font-semibold text-foreground">{device.name}</h3>
                                  <Badge variant="outline">{device.type}</Badge>
                                  <StatusBadge status={device.status} />
                                </div>
                                <p className="text-sm text-muted-foreground">{device.location}</p>
                              </div>
                              <DeviceRowActions device={device} onOpenLocationEditor={setLocationEditor} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="edge-filers">
                {filteredDevices.filter((d) => d.type === "CTERA Edge Filer").length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">{emptyCategoryHint}</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredDevices
                      .filter((d) => d.type === "CTERA Edge Filer")
                      .map((device) => (
                        <Card key={device.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-lg font-semibold text-foreground">{device.name}</h3>
                                  <Badge variant="outline">{device.type}</Badge>
                                  <StatusBadge status={device.status} />
                                </div>
                                <p className="text-sm text-muted-foreground">{device.location}</p>
                              </div>
                              <DeviceRowActions device={device} onOpenLocationEditor={setLocationEditor} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cloud-drives">
                {filteredDevices.filter((d) => d.type === "CTERA Drive").length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">{emptyCategoryHint}</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredDevices
                      .filter((d) => d.type === "CTERA Drive")
                      .map((device) => (
                        <Card key={device.id}>
                          <CardContent className="p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-lg font-semibold text-foreground">{device.name}</h3>
                                  <Badge variant="outline">{device.type}</Badge>
                                  <StatusBadge status={device.status} />
                                </div>
                                <p className="text-sm text-muted-foreground">{device.location}</p>
                              </div>
                              <DeviceRowActions device={device} onOpenLocationEditor={setLocationEditor} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mobile-app">
                <div className="text-center py-12 text-muted-foreground">No mobile app devices found</div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog
          open={!!locationEditor}
          onOpenChange={(o) => {
            if (!o) setLocationEditor(null)
          }}
        >
          <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Set device location</DialogTitle>
              <DialogDescription>
                Search for a city, street address, or landmark. Results are resolved via OpenStreetMap.
              </DialogDescription>
            </DialogHeader>
            {locationEditor && (
              <p className="text-sm font-medium text-foreground">
                {locationEditor.name}{" "}
                <span className="font-normal text-muted-foreground">({locationEditor.type})</span>
              </p>
            )}
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="e.g. Paris, France or 10 Downing Street, London"
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void runGeocode()
                  }}
                  className="flex-1"
                />
                <Button type="button" disabled={geocodeLoading} onClick={() => void runGeocode()} className="sm:w-auto">
                  {geocodeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching…
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search places
                    </>
                  )}
                </Button>
              </div>
              {geocodeError && <p className="text-sm text-destructive">{geocodeError}</p>}
              {geocodeResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pick a result</Label>
                  <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                    {geocodeResults.map((r, i) => (
                      <li key={`${r.displayName}-${i}`}>
                        <button
                          type="button"
                          onClick={() => setPickIndex(i)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            pickIndex === i
                              ? "bg-primary/10 ring-1 ring-primary"
                              : "hover:bg-muted/80"
                          }`}
                        >
                          {r.displayName}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setLocationEditor(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={pickIndex == null || !geocodeResults[pickIndex]}
                onClick={confirmLocationFromDialog}
              >
                Apply location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-device-name">Name</Label>
                <Input
                  id="new-device-name"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="e.g. Berlin office filer"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newDeviceType}
                  onValueChange={(v) => setNewDeviceType(v as PortalDevice["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Then use <span className="font-medium text-foreground">Set location</span> on that device and search for
                a real-world place.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setAddDeviceOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmAddDevice}>
                Add device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
