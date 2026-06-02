"use client"

import { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Check, ChevronsUpDown, Globe, Search, Building2 } from "lucide-react"
import { useHub } from "@/components/hub-provider"
import { useTenant } from "@/components/tenant-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function TenantSwitcher() {
  const { hub } = useHub()
  if (!hub) return null
  const tenants = hub.tenants
  const { scope, setScope } = useTenant()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tenants
    return tenants.filter(
      (t) => t.name.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q),
    )
  }, [query, tenants])

  const label = scope.type === "global" ? "Global" : scope.type === "tenant" ? scope.tenant.name : ""
  const sub = scope.type === "global" ? "All tenants" : scope.type === "tenant" ? scope.tenant.domain : ""

  const handleSelectGlobal = () => {
    setScope({ type: "global" })
    setOpen(false)
    router.push("/admin")
  }

  const handleSelectTenant = (id: string) => {
    const tenant = tenants.find((t) => t.id === id)
    if (!tenant) return
    setScope({ type: "tenant", tenant })
    setOpen(false)
    if (pathname === "/admin") {
      router.push("/")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-1.5",
            "text-left transition-colors hover:bg-muted/60",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
          )}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
            {scope.type === "global" ? <Globe className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {scope.type === "global" ? "Admin" : "Tenant"}
            </span>
            <span className="text-[13px] font-medium text-foreground">{label}</span>
          </div>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end" sideOffset={8}>
        <div className="border-b border-border px-3 py-2">
          <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search tenants..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-1.5">
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </div>
          <button
            type="button"
            onClick={handleSelectGlobal}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
              "hover:bg-muted/60",
              scope.type === "global" && "bg-muted",
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground">Global view</div>
              <div className="text-[11px] text-muted-foreground">Cross-tenant administration</div>
            </div>
            {scope.type === "global" && <Check className="h-4 w-4 text-foreground" />}
          </button>

          <div className="mt-2 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Tenants ({filtered.length})
          </div>

          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">No tenants found</div>
          ) : (
            filtered.map((tenant) => {
              const isActive = scope.type === "tenant" && scope.tenant.id === tenant.id
              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => handleSelectTenant(tenant.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                    "hover:bg-muted/60",
                    isActive && "bg-muted",
                  )}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{tenant.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{tenant.domain}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] tabular-nums text-muted-foreground">{tenant.featureAdoption}%</span>
                    {isActive && <Check className="h-4 w-4 text-foreground" />}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
