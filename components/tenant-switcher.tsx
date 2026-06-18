"use client"

import { useState, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Check, ChevronsUpDown, Globe, Search, Building2, Server } from "lucide-react"
import { useTenant } from "@/components/tenant-context"
import { scopeLabel } from "@/lib/hub-scope"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function TenantSwitcher() {
  const { customers, allDeployments, deploymentsForCustomer, scope, setScope } = useTenant()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true
      return deploymentsForCustomer(c.id).some(
        (d) => d.dnsSuffix.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
      )
    })
  }, [query, customers, deploymentsForCustomer])

  const { title: label } = scopeLabel(scope)

  const handleSelectGlobal = () => {
    setScope({ type: "global" })
    setOpen(false)
    router.push("/admin")
  }

  const handleSelectDeployment = (customerId: string, deploymentId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    const deployment = allDeployments.find((d) => d.id === deploymentId && d.customerId === customerId)
    if (!customer || !deployment) return
    setScope({ type: "deployment", customer, deployment })
    setOpen(false)
    if (pathname.startsWith("/admin")) router.push("/")
  }

  const isActiveDeployment = (deploymentId: string) =>
    scope.type === "deployment" && scope.deployment.id === deploymentId

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
              {scope.type === "global" ? "Admin" : "Customer"}
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
              placeholder="Search customers or deployments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-1.5">
          <div className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Admin</div>
          <button
            type="button"
            onClick={handleSelectGlobal}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/60",
              scope.type === "global" && "bg-muted",
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground">Global view</div>
              <div className="text-[11px] text-muted-foreground">Cross-customer administration</div>
            </div>
            {scope.type === "global" && <Check className="h-4 w-4 text-foreground" />}
          </button>

          <div className="mt-2 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Customers ({filteredCustomers.length})
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">No customers found</div>
          ) : (
            filteredCustomers.map((customer) => {
              const deps = deploymentsForCustomer(customer.id)
              const expanded = expandedCustomerId === customer.id || query.length > 0
              return (
                <div key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedCustomerId(expanded ? null : customer.id)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground truncate">{customer.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {deps.length} deployment{deps.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </button>
                  {expanded &&
                    deps.map((dep) => (
                      <button
                        key={dep.id}
                        type="button"
                        onClick={() => handleSelectDeployment(customer.id, dep.id)}
                        className={cn(
                          "ml-4 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-muted/60",
                          isActiveDeployment(dep.id) && "bg-muted",
                        )}
                      >
                        <Server className="h-3 w-3 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{dep.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{dep.dnsSuffix}</div>
                        </div>
                        {isActiveDeployment(dep.id) && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
