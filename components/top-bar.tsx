"use client"

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
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
