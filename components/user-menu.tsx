"use client"

import { LogOut, Settings, User as UserIcon, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHub } from "@/components/hub-provider"

export function UserMenu() {
  const { hub } = useHub()
  if (!hub) return null
  const currentUser = hub.currentUser

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-[12px] font-semibold text-background transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="User menu"
        >
          {currentUser.initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-[13px] font-semibold text-background">
              {currentUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-foreground truncate">{currentUser.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{currentUser.email}</div>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {currentUser.role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[13px] cursor-pointer">
          <UserIcon className="mr-2 h-3.5 w-3.5" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="text-[13px] cursor-pointer">
          <Settings className="mr-2 h-3.5 w-3.5" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[13px] cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
