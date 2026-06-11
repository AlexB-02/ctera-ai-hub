"use client"

import { useState } from "react"
import { ChevronDown, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type CopyableCollapsibleSnippetProps = {
  title: string
  content: string
  language?: "json" | "sql"
  defaultOpen?: boolean
}

export function CopyableCollapsibleSnippet({
  title,
  content,
  language = "json",
  defaultOpen = false,
}: CopyableCollapsibleSnippetProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border bg-muted/20">
      <div className="flex items-center gap-2 px-3 py-2">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left text-[13px] font-medium text-foreground hover:text-foreground/80">
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          {title}
        </CollapsibleTrigger>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]" onClick={() => void handleCopy()}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <CollapsibleContent>
        <pre
          className={cn(
            "mx-3 mb-3 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-[12px] leading-relaxed",
            language === "json" ? "font-mono" : "font-mono",
          )}
        >
          <code>{content}</code>
        </pre>
      </CollapsibleContent>
    </Collapsible>
  )
}
