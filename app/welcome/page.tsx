"use client"

import { Suspense, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Cloud,
  FileJson,
  LogOut,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Mirrors lib/hub-schema.ts → tenantSchema so the sample posts cleanly. */
const SAMPLE = JSON.stringify(
  {
    id: "northwind",
    name: "Northwind Traders",
    domain: "northwind.ctera.me",
    region: "EU",
    users: 240,
    storage: "47 TB / 80 TB",
    featureAdoption: 68,
    status: "active",
    plan: "Enterprise",
  },
  null,
  2,
)

const SCHEMA_FIELDS: { code: string; desc: string; req?: boolean }[] = [
  { code: "id", desc: "Unique tenant slug, e.g. northwind", req: true },
  { code: "name", desc: "Organization name", req: true },
  { code: "domain", desc: "Tenant address, e.g. acme.ctera.me", req: true },
  { code: "region", desc: "Deployment region, e.g. EU / US", req: true },
  { code: "users", desc: "Seat count (number)", req: true },
  { code: "storage", desc: 'Usage string, e.g. "47 TB / 80 TB"', req: true },
  { code: "featureAdoption", desc: "Feature adoption % (number)", req: true },
  { code: "status", desc: "active · trial · suspended", req: true },
  { code: "plan", desc: "Enterprise · Business · Starter", req: true },
  { code: "contentProfile", desc: "default · features-only (optional)" },
]

const REQUIRED = ["id", "name", "domain", "region", "users", "storage", "featureAdoption", "status", "plan"]

/** Build a ready-to-edit tenant config from the register form's org + subdomain. */
function prefillFrom(org: string, sub: string): string {
  return JSON.stringify(
    {
      id: sub,
      name: org,
      domain: `${sub}.ctera.me`,
      region: "EU",
      users: 25,
      storage: "0 TB / 50 TB",
      featureAdoption: 0,
      status: "trial",
      plan: "Business",
    },
    null,
    2,
  )
}

type Status = { kind: "idle" | "ok" | "err"; msg: string }

function validate(text: string): { tenant?: Record<string, unknown>; error?: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { error: "Invalid JSON — " + (e instanceof Error ? e.message : "parse error") }
  }
  if (Array.isArray(data) || typeof data !== "object" || !data) {
    return { error: "Config must be a JSON object." }
  }
  const obj = data as Record<string, unknown>
  for (const key of REQUIRED) {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
      return { error: `Missing required field: “${key}”.` }
    }
  }
  return { tenant: obj }
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle light or dark theme"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeContent />
    </Suspense>
  )
}

function WelcomeContent() {
  const router = useRouter()
  const params = useSearchParams()
  const org = params.get("org")?.trim()
  const sub = params.get("sub")?.trim()
  const prefilled = !!(org && sub)
  const initialJson = prefilled ? prefillFrom(org!, sub!) : SAMPLE

  const [json, setJson] = useState(initialJson)
  const [status, setStatus] = useState<Status>(
    prefilled
      ? { kind: "ok", msg: `Prefilled from “${org}” — review the defaults and create.` }
      : { kind: "idle", msg: "Paste or edit your tenant configuration, then create the tenant." },
  )
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const valid = useMemo(() => validate(json), [json])

  function onEdit(value: string) {
    setJson(value)
    const r = validate(value)
    if (r.error) setStatus({ kind: "err", msg: r.error })
    else setStatus({ kind: "ok", msg: `Valid config for “${r.tenant!.name}” — ready to create.` })
  }

  function loadSample() {
    setJson(SAMPLE)
    setStatus({ kind: "ok", msg: "Sample loaded — review and create." })
  }

  function format() {
    const r = validate(json)
    if (r.error) return setStatus({ kind: "err", msg: r.error })
    const pretty = JSON.stringify(r.tenant, null, 2)
    setJson(pretty)
    setStatus({ kind: "ok", msg: "Formatted." })
  }

  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      setJson(text)
      const r = validate(text)
      if (r.error) setStatus({ kind: "err", msg: r.error })
      else setStatus({ kind: "ok", msg: `Loaded ${file.name} — ready to create.` })
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  async function createTenant() {
    const r = validate(json)
    if (r.error) return setStatus({ kind: "err", msg: r.error })
    setBusy(true)
    try {
      const res = await fetch("/api/hub-data/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant: r.tenant }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || res.statusText)
      }
      setStatus({ kind: "ok", msg: "Tenant created — entering your hub…" })
      router.push("/")
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed to create tenant." })
      setBusy(false)
    }
  }

  const StatusIcon = status.kind === "ok" ? CheckCircle2 : status.kind === "err" ? AlertTriangle : FileJson

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-background">
      {/* top bar */}
      <div className="sticky top-0 z-[5] flex h-16 items-center gap-3 border-b border-border bg-card/90 px-7 backdrop-blur">
        <span
          className="grid h-8 w-8 flex-none place-items-center rounded-[9px] text-white"
          style={{ background: "var(--grad-primary)" }}
        >
          <Cloud className="h-[17px] w-[17px]" />
        </span>
        <span className="font-display text-[15px] font-bold text-foreground">CTERA Customer Hub</span>
        <span className="flex-1" />
        <ThemeToggle />
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/login")}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <div className="mx-auto max-w-[1080px] px-7 pb-16 pt-8">
        {/* hero */}
        <section
          className="relative mb-6 overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
          style={{ background: "var(--grad-customers)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ctera-curve.svg"
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-6 top-5 w-36 opacity-15"
          />
          <div className="relative">
            <div className="text-[13px] font-medium text-white/75">Get started</div>
            <h2 className="mt-2 text-[27px] font-bold tracking-tight text-white">Welcome 👋</h2>
            <p className="mt-1.5 max-w-xl text-sm text-white/85">
              You&apos;re signed in, but no tenant is connected to your account yet. Add a tenant configuration
              below to populate your CTERA Customer Hub.
            </p>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          {/* JSON editor */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-2.5">
              <span className="flex gap-1.5">
                <i className="block h-2.5 w-2.5 rounded-full" style={{ background: "#ef6b5e" }} />
                <i className="block h-2.5 w-2.5 rounded-full" style={{ background: "#f4bd4f" }} />
                <i className="block h-2.5 w-2.5 rounded-full" style={{ background: "#5bcb8b" }} />
              </span>
              <span className="font-mono text-xs text-muted-foreground">tenant.config.json</span>
              <span className="ml-auto flex gap-1.5">
                <Button type="button" variant="secondary" size="sm" onClick={loadSample}>
                  <Sparkles className="h-3.5 w-3.5" /> Load sample
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={format}>
                  <CheckSquare className="h-3.5 w-3.5" /> Format
                </Button>
              </span>
            </div>

            <textarea
              value={json}
              onChange={(e) => onEdit(e.target.value)}
              spellCheck={false}
              aria-label="Tenant configuration JSON"
              className="block min-h-[432px] w-full resize-y whitespace-pre p-4 font-mono text-[12.5px] leading-relaxed text-[#d6deec] outline-none"
              style={{ background: "#0c1c34", tabSize: 2 }}
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-border bg-card px-4 py-3">
              <div
                className={cn(
                  "flex min-w-[180px] flex-1 items-center gap-2 text-[12.5px] font-semibold",
                  status.kind === "ok" && "text-[color:var(--success)]",
                  status.kind === "err" && "text-destructive",
                  status.kind === "idle" && "text-muted-foreground",
                )}
              >
                <StatusIcon className="h-[15px] w-[15px] flex-none" />
                <span>{status.msg}</span>
              </div>
              <Button
                type="button"
                onClick={createTenant}
                disabled={busy || !!valid.error}
                className="text-white"
                style={{ background: "var(--grad-primary)" }}
              >
                <Plus className="h-4 w-4" /> {busy ? "Creating…" : "Create tenant"}
              </Button>
            </div>
          </div>

          {/* helper */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-[15px] font-bold text-foreground">What&apos;s a tenant config?</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  A small JSON document describing one CTERA tenant. All core fields below are required; the hub
                  fills in view data with sensible defaults.
                </p>
                <ul className="mt-3.5">
                  {SCHEMA_FIELDS.map((f, i) => (
                    <li
                      key={f.code}
                      className={cn(
                        "flex items-baseline gap-2.5 py-2.5 text-[12.5px]",
                        i > 0 && "border-t border-border",
                      )}
                    >
                      <code className="whitespace-nowrap rounded bg-accent px-1.5 py-0.5 font-mono text-[11.5px] text-accent-foreground">
                        {f.code}
                      </code>
                      <span className="text-muted-foreground">
                        {f.desc}
                        {f.req && (
                          <span className="ml-1 text-[9.5px] font-bold uppercase tracking-wide text-destructive">
                            req
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-[15px] font-bold text-foreground">Prefer to upload?</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Use <b>Upload</b> to drop in a <code className="font-mono">.json</code> file exported from your
                  portal — it loads straight into the editor for review before you create the tenant.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onUpload} />
    </div>
  )
}
