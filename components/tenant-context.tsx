"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Tenant } from "@/lib/hub-schema"
import { useHub } from "@/components/hub-provider"

type Scope = { type: "global" } | { type: "tenant"; tenant: Tenant }

type TenantContextValue = {
  scope: Scope
  setScope: (scope: Scope) => void
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

export function TenantProvider({ children }: { children: ReactNode }) {
  const { hub } = useHub()
  if (!hub) throw new Error("TenantProvider requires HubProvider with loaded data")

  const tenants = hub.tenants

  const [scope, setScope] = useState<Scope>({ type: "tenant", tenant: tenants[0] })

  useEffect(() => {
    setScope((s) => {
      if (s.type === "global") return s
      const match = tenants.find((t) => t.id === s.tenant.id)
      if (match) return { type: "tenant", tenant: match }
      return { type: "tenant", tenant: tenants[0] }
    })
  }, [tenants])

  return <TenantContext.Provider value={{ scope, setScope }}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider")
  return ctx
}
