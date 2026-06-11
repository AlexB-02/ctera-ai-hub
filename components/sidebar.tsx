"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Server,
  Download,
  Settings,
  Sparkles,
  HelpCircle,
  Users,
  Globe,
  Building2,
  CheckSquare,
  Search,
  Check,
  ChevronsUpDown,
  LogOut,
  User as UserIcon,
  Shield,
} from "lucide-react"
import { useTenant } from "@/components/tenant-context"
import { useHub } from "@/components/hub-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const tenantNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Recommendations", href: "/insights", icon: Sparkles, badge: "3" },
  { name: "Deployment", href: "/portal", icon: Server },
  { name: "Feature Adoption", href: "/feature-adoption", icon: Settings },
  { name: "Downloads", href: "/downloads", icon: Download, badge: "9" },
  { name: "Peer Review", href: "/peer-review", icon: Users },
]

const adminNavigation = [
  { name: "Global View", href: "/admin", icon: Globe },
  { name: "Tenants", href: "/admin/tenants", icon: Building2 },
  { name: "Downloads Center", href: "/admin/downloads", icon: Download },
  { name: "Feature Adoption", href: "/admin/feature-adoption", icon: CheckSquare },
  { name: "Users", href: "/admin/users", icon: Users },
]

function NavItem({
  item,
  isActive,
}: {
  item: { name: string; href: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; badge?: string }
  isActive: boolean
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-sidebar-accent text-white"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white",
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-white"
        />
      )}
      <item.icon className="h-[16px] w-[16px] flex-shrink-0" strokeWidth={1.75} />
      <span className="flex-1 truncate">{item.name}</span>
      {item.badge && (
        <span
          className={cn(
            "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium tabular-nums",
            isActive ? "bg-white/15 text-white" : "bg-white/10 text-sidebar-foreground/90",
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

function TenantSwitcherInline() {
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

  const label = scope.type === "global" ? "Global view" : scope.tenant.name
  const sub = scope.type === "global" ? "All tenants" : scope.tenant.domain

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
    // If currently on an admin page, navigate to tenant dashboard
    if (pathname.startsWith("/admin")) {
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
          className="flex w-full items-center gap-2.5 rounded-md bg-sidebar-accent/40 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/70 focus:outline-none"
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/10">
            {scope.type === "global" ? (
              <Globe className="h-3.5 w-3.5 text-white" />
            ) : (
              <Building2 className="h-3.5 w-3.5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-white">{label}</div>
            <div className="truncate text-[10px] text-sidebar-foreground/50">{sub}</div>
          </div>
          <ChevronsUpDown className="h-3 w-3 flex-shrink-0 text-sidebar-foreground/40" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" side="right" sideOffset={12}>
        <div className="border-b border-border p-2">
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
        <div className="max-h-[400px] overflow-y-auto p-1.5">
          <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin
          </p>
          <button
            type="button"
            onClick={handleSelectGlobal}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/70",
              scope.type === "global" && "bg-muted",
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Globe className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-foreground">Global view</div>
              <div className="text-[11px] text-muted-foreground">Cross-tenant administration</div>
            </div>
            {scope.type === "global" && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>

          <p className="mt-1 px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Tenants ({filtered.length})
          </p>
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No tenants found</div>
          ) : (
            filtered.map((tenant) => {
              const isActive = scope.type === "tenant" && scope.tenant.id === tenant.id
              return (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => handleSelectTenant(tenant.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/70",
                    isActive && "bg-muted",
                  )}
                >
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-popover"
                      style={{
                        background:
                          tenant.status === "active"
                            ? "#2a9d8f"
                            : tenant.status === "trial"
                              ? "#cd7a0c"
                              : "#d92d20",
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-foreground">{tenant.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{tenant.domain}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {tenant.users} users · {tenant.featureAdoption}%
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
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

export function Sidebar() {
  const pathname = usePathname()
  const { hub } = useHub()
  if (!hub) return null

  const currentUser = hub.currentUser
  const { scope } = useTenant()
  const isAdminMode = pathname.startsWith("/admin")

  return (
    <div className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col self-start bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ctera-logo-white.svg" alt="CTERA" className="h-[18px] w-auto" />
        {isAdminMode && (
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/60">
            Admin
          </span>
        )}
      </div>

      {/* Tenant / scope switcher — always visible */}
      <div className="px-3 pb-3">
        <TenantSwitcherInline />
      </div>

      <div className="h-px bg-sidebar-border mx-3 mb-2" />

      {isAdminMode ? (
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
          <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/40">
            Administration
          </p>
          {adminNavigation.map((item) => (
            <NavItem key={item.name} item={item} isActive={pathname === item.href || pathname === item.href + "/"} />
          ))}
        </nav>
      ) : (
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-1">
          {tenantNavigation.map((item) => (
            <NavItem key={item.name} item={item} isActive={pathname === item.href} />
          ))}
        </nav>
      )}

      {/* User profile footer */}
      <div className="border-t border-sidebar-border px-3.5 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/[0.07] focus:outline-none"
            >
              <div
                className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold text-white"
                style={{ background: "linear-gradient(120deg,#46bea5,#2a9d8f)" }}
              >
                {currentUser.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold text-white">{currentUser.name}</div>
                <div className="truncate text-[10.5px] text-sidebar-foreground/60">{currentUser.role}</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-64 mb-2" sideOffset={12}>
            <DropdownMenuLabel className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[12px] font-semibold text-background">
                  {currentUser.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-foreground">{currentUser.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{currentUser.email}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
                <Shield className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {currentUser.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[13px]">
              <UserIcon className="mr-2 h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-[13px]">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[13px] text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
