"use client"

import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { SeedHubData } from "@/lib/seed-hub"

export type PortalDevice = SeedHubData["portal"]["devices"][number]

function statusColor(device: PortalDevice): string {
  return device.status === "up-to-date"
    ? "#22c55e"
    : device.status === "update-critical"
      ? "#ef4444"
      : device.status === "update-required"
        ? "#f59e0b"
        : "#64748b"
}

/** Manual devices at 0,0 are treated as not yet placed (omit from map). */
function showDeviceOnMap(device: PortalDevice): boolean {
  if (typeof device.id === "number" && device.id < 0) {
    return !(device.lat === 0 && device.lng === 0)
  }
  return true
}

function escapePopup(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type DeploymentLocationsMapProps = {
  devices: PortalDevice[]
}

/** Interactive map (OpenStreetMap tiles): zoom, pan, popups. Prefer loading via `next/dynamic` with `ssr: false`. */
export function DeploymentLocationsMap({ devices }: DeploymentLocationsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const groupRef = useRef<L.LayerGroup | null>(null)

  const mappable = useMemo(() => devices.filter(showDeviceOnMap), [devices])

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([20, 0], 2)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    const group = L.layerGroup().addTo(map)
    mapRef.current = map
    groupRef.current = group

    return () => {
      map.remove()
      mapRef.current = null
      groupRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = groupRef.current
    if (!map || !group) return

    group.clearLayers()
    const latLngs: L.LatLng[] = []

    for (const d of mappable) {
      const ll = L.latLng(d.lat, d.lng)
      latLngs.push(ll)
      const circle = L.circleMarker(ll, {
        radius: 9,
        fillColor: statusColor(d),
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.92,
      })
      circle.bindPopup(
        `<div style="min-width:180px"><strong>${escapePopup(d.name)}</strong><br/><span style="opacity:.85">${escapePopup(d.type)}</span><br/><span style="font-size:12px">${escapePopup(d.location)}</span></div>`,
      )
      circle.addTo(group)
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0]!, Math.max(map.getZoom(), 6))
    } else if (latLngs.length > 1) {
      const b = L.latLngBounds(latLngs)
      map.fitBounds(b, { padding: [48, 48], maxZoom: 11 })
    } else {
      map.setView([20, 0], 2)
    }
  }, [mappable])

  return (
    <div className="relative z-0 h-[min(420px,55vh)] w-full overflow-hidden rounded-lg border border-border">
      <div
        ref={containerRef}
        className="leaflet-container h-full w-full bg-muted/30 [&_.leaflet-control-attribution]:text-[10px]"
      />
    </div>
  )
}
