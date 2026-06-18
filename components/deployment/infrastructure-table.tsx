"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Column<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => React.ReactNode
}

export function InfrastructureTable<T extends { id: string }>({
  title,
  rows,
  columns,
  emptyMessage,
}: {
  title: string
  rows: T[]
  columns: Column<T>[]
  emptyMessage: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-[15px] font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                        c.className,
                      )}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 text-[13px]", c.className)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatusDot({ status }: { status: "online" | "offline" | "degraded" }) {
  const color =
    status === "online" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500"
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="capitalize text-[12px]">{status}</span>
    </span>
  )
}

export function VersionCell({
  installed,
  latest,
}: {
  installed: string
  latest?: string
}) {
  const outdated = latest && installed !== latest
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[12px] tabular-nums">{installed}</span>
      {outdated && (
        <Badge variant="outline" className="w-fit text-[10px] text-amber-700 border-amber-200">
          Latest {latest}
        </Badge>
      )}
    </div>
  )
}
