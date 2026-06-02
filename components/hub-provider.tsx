"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { HubResponsePayload } from "@/lib/hub-types"

type HubContextValue = {
  hub: HubResponsePayload | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const HubContext = createContext<HubContextValue | undefined>(undefined)

export function HubProvider({ children }: { children: ReactNode }) {
  const [hub, setHub] = useState<HubResponsePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/hub-data", { cache: "no-store" })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || res.statusText)
      }
      setHub((await res.json()) as HubResponsePayload)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load hub data")
      setHub(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return <HubContext.Provider value={{ hub, loading, error, reload }}>{children}</HubContext.Provider>
}

export function useHub() {
  const ctx = useContext(HubContext)
  if (!ctx) throw new Error("useHub must be used within HubProvider")
  return ctx
}
