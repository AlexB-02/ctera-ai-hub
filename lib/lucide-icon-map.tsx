import type { LucideIcon } from "lucide-react"
import {
  Brain,
  CheckSquare,
  Database,
  HardDrive,
  Mail,
  Server,
  Smartphone,
  Sparkles,
} from "lucide-react"

const dashboardVersionIcons: Record<string, LucideIcon> = {
  Server,
  HardDrive,
  Database,
  Smartphone,
}

const dashboardNewsIcons: Record<string, LucideIcon> = {
  Sparkles,
  Brain,
  CheckSquare,
  Mail,
}

const deviceIcons: Record<string, LucideIcon> = {
  Server,
  HardDrive,
  Database,
}

const downloadsProductIcons: Record<string, LucideIcon> = {
  Server,
  HardDrive,
  Database,
}

export function getDashboardVersionIcon(name: string | undefined): LucideIcon {
  if (name && dashboardVersionIcons[name]) return dashboardVersionIcons[name]
  return Server
}

export function getDashboardNewsIcon(name: string | undefined): LucideIcon {
  if (name && dashboardNewsIcons[name]) return dashboardNewsIcons[name]
  return Sparkles
}

export function getDeviceIcon(name: string | undefined): LucideIcon {
  if (name && deviceIcons[name]) return deviceIcons[name]
  return Server
}

export function getDownloadsProductIcon(name: string | undefined): LucideIcon {
  if (name && downloadsProductIcons[name]) return downloadsProductIcons[name]
  return Server
}
