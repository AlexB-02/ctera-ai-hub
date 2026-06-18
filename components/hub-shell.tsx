"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { HubProvider, useHub } from "@/components/hub-provider"
import { TenantProvider } from "@/components/tenant-context"
import { AIChatWidget } from "@/components/ai-chat-widget"

/** Routes that render standalone, outside the authenticated hub shell. */
const STANDALONE_ROUTES = ["/login", "/welcome"]

function HubReady({ children }: { children: ReactNode }) {
  const { hub, loading, error } = useHub()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Loading hub data…
      </div>
    )
  }

  if (error || !hub) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-background p-8 text-center">
        <p className="font-medium text-destructive">Could not load hub data</p>
        <p className="max-w-md text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
      </div>
    )
  }

  return <TenantProvider>{children}</TenantProvider>
}

export function HubShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Pre-auth screens (e.g. /login) render on their own, without hub data or the AI widget.
  if (pathname && STANDALONE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return <>{children}</>
  }

  return (
    <HubProvider>
      <HubReady>
        {children}
        <AIChatWidget />
      </HubReady>
    </HubProvider>
  )
}
