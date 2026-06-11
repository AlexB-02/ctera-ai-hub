"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  AlertTriangle,
  ArrowRight,
  Cloud,
  Lightbulb,
  Moon,
  Server,
  Shield,
  Sparkles,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type Tab = "signin" | "register"

const BRAND_FEATURES = [
  {
    icon: Sparkles,
    title: "AI recommendations",
    body: "ARIA surfaces the next best action for your estate.",
  },
  {
    icon: Shield,
    title: "Security posture",
    body: "Track anomaly detection, file locks and snapshots.",
  },
  {
    icon: Server,
    title: "Unified fleet",
    body: "Portals, edge filers and drives across every site.",
  },
]

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

function BrandPanel() {
  return (
    <div
      className="relative hidden flex-col overflow-hidden p-12 text-white lg:flex"
      style={{ background: "var(--grad-customers)" }}
    >
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -right-32 h-[480px] w-[480px]"
        style={{
          background: "radial-gradient(circle, rgba(84,191,245,.42), transparent 62%)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ctera-curve.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[-50px] top-16 w-[340px] opacity-[0.12]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ctera-logo-white.svg" alt="CTERA" className="relative z-[1] h-6 w-auto self-start" />

      <div className="relative z-[1] my-auto">
        <div className="text-sm text-white/70">Customer Hub</div>
        <h1 className="mb-4 mt-3.5 max-w-[13ch] text-[35px] font-bold leading-[1.1] text-white">
          Your CTERA estate, intelligently managed.
        </h1>
        <p className="max-w-[40ch] text-[15px] leading-relaxed text-white/80">
          One hub for every tenant — AI recommendations, device health, feature adoption and downloads,
          all in one place.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {BRAND_FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3.5">
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl border border-white/20 bg-white/10">
                <Icon className="h-[19px] w-[19px]" />
              </span>
              <span>
                <b className="block font-display text-sm font-bold text-white">{title}</b>
                <span className="text-[12.5px] text-white/70">{body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-[1] text-xs text-white/60">
        © CTERA Networks Ltd. &nbsp;·&nbsp; Your files, your cloud.
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("signin")
  const [error, setError] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)

  function switchTab(next: Tab) {
    setTab(next)
    setError("")
  }

  function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem("si-email") as HTMLInputElement).value.trim()
    const pass = (form.elements.namedItem("si-pass") as HTMLInputElement).value
    if (!email || !/.+@.+\..+/.test(email)) return setError("Enter a valid work email address.")
    if (!pass) return setError("Enter your password.")
    setError("")
    router.push("/welcome")
  }

  function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = e.currentTarget.elements
    const org = (f.namedItem("rg-org") as HTMLInputElement).value.trim()
    const sub = (f.namedItem("rg-sub") as HTMLInputElement).value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
    const name = (f.namedItem("rg-name") as HTMLInputElement).value.trim()
    const email = (f.namedItem("rg-email") as HTMLInputElement).value.trim()
    const pass = (f.namedItem("rg-pass") as HTMLInputElement).value
    if (!org) return setError("Enter your organization name.")
    if (!sub) return setError("Choose a tenant subdomain.")
    if (!name) return setError("Enter the admin's full name.")
    if (!email || !/.+@.+\..+/.test(email)) return setError("Enter a valid work email address.")
    if (!pass || pass.length < 8) return setError("Password must be at least 8 characters.")
    if (!agreedTerms) return setError("Please accept the terms to continue.")
    setError("")
    const params = new URLSearchParams({ org, sub })
    router.push(`/welcome?${params.toString()}`)
  }

  const isReg = tab === "register"

  return (
    <div className="fixed inset-0 z-[100] grid grid-cols-1 bg-background lg:grid-cols-[1.04fr_1fr]">
      <BrandPanel />

      <div className="relative flex items-center justify-center overflow-y-auto p-10">
        <div className="absolute right-6 top-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[408px]">
          {/* wordmark */}
          <div className="mb-7 flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 flex-none place-items-center rounded-[10px] text-white"
              style={{ background: "var(--grad-primary)" }}
            >
              <Cloud className="h-[19px] w-[19px]" />
            </span>
            <span className="font-display text-base font-bold leading-tight text-foreground">
              CTERA Customer Hub
            </span>
          </div>

          <h2 className="text-[23px] font-bold text-foreground">
            {isReg ? "Register a tenant" : "Welcome back"}
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">
            {isReg
              ? "Spin up a new CTERA tenant for your organization."
              : "Sign in to your CTERA Customer Hub."}
          </p>

          {/* segmented control */}
          <div
            role="tablist"
            className="my-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-muted p-1"
          >
            {(
              [
                ["signin", "Sign in"],
                ["register", "Register a tenant"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => switchTab(value)}
                className={cn(
                  "rounded-full py-2.5 font-display text-[13px] font-semibold transition-colors",
                  tab === value
                    ? "bg-card text-foreground shadow-sm dark:bg-primary dark:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2.5 text-[12.5px] leading-snug text-destructive">
              <AlertTriangle className="mt-px h-[15px] w-[15px] flex-none" />
              <span>{error}</span>
            </div>
          )}

          {isReg ? (
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <Field id="rg-org" label="Organization name" placeholder="Northwind Traders" />
              <div>
                <Label htmlFor="rg-sub" className="mb-1.5 block font-display text-[12.5px] font-semibold text-foreground">
                  Tenant subdomain
                </Label>
                <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                  <Input
                    id="rg-sub"
                    name="rg-sub"
                    autoCapitalize="none"
                    placeholder="northwind"
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                  <span className="flex items-center border-l border-border bg-muted px-3.5 text-[13px] text-muted-foreground">
                    .ctera.me
                  </span>
                </div>
              </div>
              <Field id="rg-name" label="Admin full name" placeholder="Dana Reuben" />
              <Field id="rg-email" label="Work email" type="email" placeholder="dana@northwind.com" autoComplete="username" />
              <Field id="rg-pass" label="Create password" type="password" placeholder="At least 8 characters" autoComplete="new-password" />
              <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
                <Checkbox
                  id="rg-terms"
                  checked={agreedTerms}
                  onCheckedChange={(v) => setAgreedTerms(v === true)}
                />
                I agree to the CTERA terms &amp; privacy policy
              </label>
              <Button type="submit" className="h-11 w-full text-sm text-white" style={{ background: "var(--grad-primary)" }}>
                Register tenant <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} noValidate className="space-y-4">
              <Field id="si-email" label="Work email" type="email" placeholder="you@company.com" autoComplete="username" />
              <Field id="si-pass" label="Password" type="password" placeholder="••••••••" autoComplete="current-password" />
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Checkbox id="si-remember" defaultChecked /> Keep me signed in
                </label>
                <button
                  type="button"
                  className="text-[12.5px] font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Button type="submit" className="h-11 w-full text-sm text-white" style={{ background: "var(--grad-primary)" }}>
                Sign in <ArrowRight className="h-4 w-4" />
              </Button>
              <div className="flex items-start gap-1.5 text-[11.5px] leading-snug text-muted-foreground">
                <Lightbulb className="mt-px h-3.5 w-3.5 flex-none" />
                <span>
                  Signing in for the first time? You&apos;ll connect a tenant with a configuration file on the
                  next step.
                </span>
              </div>
            </form>
          )}

          <div className="mt-5 text-center text-[12.5px] text-muted-foreground">
            {isReg ? (
              <>
                Already have an account?{" "}
                <button onClick={() => switchTab("signin")} className="font-semibold text-primary hover:underline">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to CTERA?{" "}
                <button onClick={() => switchTab("register")} className="font-semibold text-primary hover:underline">
                  Register a tenant
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block font-display text-[12.5px] font-semibold text-foreground">
        {label}
      </Label>
      <Input id={id} name={id} type={type} placeholder={placeholder} autoComplete={autoComplete} />
    </div>
  )
}
