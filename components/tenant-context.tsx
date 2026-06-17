"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { HubScope } from "@/lib/hub-scope"
import type { Customer, Deployment } from "@/lib/customer-schema"
import { useHub } from "@/components/hub-provider"
import {
  defaultCustomerDeployment,
  findCustomerDeployment,
  resolveCustomers,
  resolveDeployments,
  seedHierarchyDefaults,
} from "@/lib/customer-hierarchy"

export type { HubScope } from "@/lib/hub-scope"

type TenantContextValue = {
  scope: HubScope
  setScope: (scope: HubScope) => void
  customers: Customer[]
  allDeployments: Deployment[]
  deploymentsForCustomer: (customerId: string) => Deployment[]
}

const SCOPE_STORAGE_KEY = "ctera-hub/scope/v2"

const TenantContext = createContext<TenantContextValue | undefined>(undefined)

function loadStoredScope(): { customerId: string; deploymentId: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SCOPE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { customerId?: string; deploymentId?: string }
    if (parsed.customerId && parsed.deploymentId) return { customerId: parsed.customerId, deploymentId: parsed.deploymentId }
  } catch {
    /* ignore */
  }
  return null
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { hub } = useHub()
  if (!hub) throw new Error("TenantProvider requires HubProvider with loaded data")

  const { customers, deployments } = useMemo(() => {
    const seeded = seedHierarchyDefaults(hub)
    return {
      customers: resolveCustomers({ ...hub, customers: seeded.customers, deployments: seeded.deployments }),
      deployments: resolveDeployments({ ...hub, customers: seeded.customers, deployments: seeded.deployments }),
    }
  }, [hub])

  const [scope, setScopeState] = useState<HubScope>(() => {
    const stored = loadStoredScope()
    if (stored) {
      const match = findCustomerDeployment(customers, deployments, stored.customerId, stored.deploymentId)
      if (match) return { type: "deployment", ...match }
    }
    const def = defaultCustomerDeployment(customers, deployments)
    return def ? { type: "deployment", ...def } : { type: "global" }
  })

  const setScope = (next: HubScope) => {
    setScopeState(next)
    if (next.type === "deployment" && typeof window !== "undefined") {
      localStorage.setItem(
        SCOPE_STORAGE_KEY,
        JSON.stringify({ customerId: next.customer.id, deploymentId: next.deployment.id }),
      )
    }
  }

  useEffect(() => {
    setScopeState((s) => {
      if (s.type === "global") return s
      const match = findCustomerDeployment(customers, deployments, s.customer.id, s.deployment.id)
      if (match) return { type: "deployment", ...match }
      const def = defaultCustomerDeployment(customers, deployments)
      return def ? { type: "deployment", ...def } : { type: "global" }
    })
  }, [customers, deployments])

  const deploymentsForCustomerFn = (customerId: string) =>
    deployments.filter((d) => d.customerId === customerId)

  return (
    <TenantContext.Provider
      value={{
        scope,
        setScope,
        customers,
        allDeployments: deployments,
        deploymentsForCustomer: deploymentsForCustomerFn,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider")
  return ctx
}

/** Alias for customer/deployment scope */
export function useHubScope() {
  return useTenant()
}
