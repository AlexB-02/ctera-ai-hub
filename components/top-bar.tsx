"use client"

import { Bell, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

type TopBarProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="border-b bg-card">
      <div className="flex h-14 items-center justify-between gap-4 px-8">
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold tracking-tight text-foreground truncate">{title}</h1>
          {subtitle && <p className="text-[12px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <div className="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-muted-foreground lg:flex">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Search the hub..."
              aria-label="Search the hub"
              className="w-40 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
