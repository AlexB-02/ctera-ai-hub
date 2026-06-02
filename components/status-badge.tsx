import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "up-to-date" | "update-required" | "update-critical"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    "up-to-date": {
      label: "Up to date",
      dotClass: "bg-success",
      textClass: "text-foreground/80",
      borderClass: "border-border bg-card",
    },
    "update-required": {
      label: "Update required",
      dotClass: "bg-warning",
      textClass: "text-foreground/80",
      borderClass: "border-border bg-card",
    },
    "update-critical": {
      label: "Update critical",
      dotClass: "bg-critical",
      textClass: "text-foreground/80",
      borderClass: "border-border bg-card",
    },
  }

  const { label, dotClass, textClass, borderClass } = config[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        borderClass,
        textClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />
      {label}
    </div>
  )
}
