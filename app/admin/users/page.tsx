"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "Read/Write Administrator" | "Read-Only Administrator"
type Status = "Active" | "Suspended"

interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  status: Status
  ssoIdentifier: string
  lastLogin: string
  createdAt: string
}

const initialUsers: AdminUser[] = [
  {
    id: "1",
    firstName: "Sean",
    lastName: "Holmes",
    email: "sean.holmes@ctera.com",
    role: "Read/Write Administrator",
    status: "Active",
    ssoIdentifier: "sean.holmes@ctera.com",
    lastLogin: "2025-04-28",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    firstName: "Alex",
    lastName: "Berman",
    email: "alex.berman@ctera.com",
    role: "Read/Write Administrator",
    status: "Active",
    ssoIdentifier: "alex.berman@ctera.com",
    lastLogin: "2025-04-27",
    createdAt: "2024-02-08",
  },
  {
    id: "3",
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@ctera.com",
    role: "Read-Only Administrator",
    status: "Active",
    ssoIdentifier: "maria.santos@ctera.com",
    lastLogin: "2025-04-25",
    createdAt: "2024-03-20",
  },
  {
    id: "4",
    firstName: "David",
    lastName: "Kim",
    email: "david.kim@partner.com",
    role: "Read-Only Administrator",
    status: "Suspended",
    ssoIdentifier: "david.kim@partner.com",
    lastLogin: "2025-03-10",
    createdAt: "2024-05-01",
  },
]

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  role: "Read/Write Administrator" as Role,
  status: "Active" as Status,
  ssoIdentifier: "",
}

function initials(u: AdminUser) {
  return `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase()
}

function avatarColor(id: string) {
  const colors = [
    "var(--grad-primary)",
    "var(--grad-customers)",
    "var(--grad-teal)",
    "var(--grad-orange)",
    "var(--grad-partners)",
    "var(--grad-internal)",
  ]
  return colors[parseInt(id, 10) % colors.length]
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Partial<typeof emptyForm>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.ssoIdentifier.toLowerCase().includes(q)
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  function openNew() {
    setEditingUser(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(u: AdminUser) {
    setEditingUser(u)
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      status: u.status,
      ssoIdentifier: u.ssoIdentifier,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function validate() {
    const e: Partial<typeof emptyForm> = {}
    if (!form.firstName.trim()) e.firstName = "Required"
    if (!form.lastName.trim()) e.lastName = "Required"
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required"
    if (!form.ssoIdentifier.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ssoIdentifier))
      e.ssoIdentifier = "Valid SSO email required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...form } : u)),
      )
    } else {
      const newUser: AdminUser = {
        id: String(Date.now()),
        ...form,
        lastLogin: "Never",
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setUsers((prev) => [...prev, newUser])
    }
    setDialogOpen(false)
  }

  function handleDelete(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setDeleteId(null)
  }

  const rwCount = users.filter((u) => u.role === "Read/Write Administrator").length
  const roCount = users.filter((u) => u.role === "Read-Only Administrator").length
  const activeCount = users.filter((u) => u.status === "Active").length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          title="Users"
          subtitle="Manage platform administrators with SSO-based access"
          actions={
            <Button size="sm" onClick={openNew} className="gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              New User
            </Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Branded hero */}
          <section
            className="relative overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
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
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/75">
                <ShieldCheck className="h-3.5 w-3.5" /> Administrators
              </div>
              <h2 className="mt-2 text-[27px] font-bold tracking-tight text-white">Manage platform access</h2>
              <p className="mt-1.5 max-w-xl text-sm text-white/85">
                {users.length} administrators with SSO-based access, {activeCount} active.
              </p>
            </div>
          </section>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Administrators", value: users.length, sub: "All access levels" },
              { label: "Read/Write", value: rwCount, sub: "Full management access" },
              { label: "Read-Only", value: roCount, sub: "View-only access" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="font-display text-[28px] font-bold tracking-tight tabular-nums text-primary">{s.value}</div>
                <div className="mt-0.5 text-[13px] font-medium text-foreground">{s.label}</div>
                <div className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
              <SelectTrigger className="h-9 w-52 text-sm">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="Read/Write Administrator">Read/Write Administrator</SelectItem>
                <SelectItem value="Read-Only Administrator">Read-Only Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    SSO Identifier
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Last Login
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="group transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                            style={{ background: avatarColor(u.id) }}
                          >
                            {initials(u)}
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-foreground">
                              {u.firstName} {u.lastName}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{u.ssoIdentifier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.role === "Read/Write Administrator" ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                          )}
                          <span className="text-[12px] text-foreground">{u.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            u.status === "Active"
                              ? "bg-success/10 text-success border-success/30"
                              : "bg-critical/10 text-critical border-critical/30",
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              u.status === "Active" ? "bg-success" : "bg-critical",
                            )}
                          />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{u.lastLogin}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer text-[13px]"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-[13px] text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(u.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New / Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              {editingUser ? "Edit User" : "New User"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                  First Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jane"
                  className={cn("h-9 text-sm", errors.firstName && "border-destructive")}
                />
                {errors.firstName && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Smith"
                  className={cn("h-9 text-sm", errors.lastName && "border-destructive")}
                />
                {errors.lastName && (
                  <p className="mt-1 text-[11px] text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane.smith@company.com"
                className={cn("h-9 text-sm", errors.email && "border-destructive")}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-destructive">{errors.email}</p>
              )}
            </div>

            {/* SSO Identifier */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                SSO Identifier (Email) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.ssoIdentifier}
                  onChange={(e) => setForm((f) => ({ ...f, ssoIdentifier: e.target.value }))}
                  placeholder="jane.smith@sso-provider.com"
                  className={cn("h-9 pl-8 text-sm", errors.ssoIdentifier && "border-destructive")}
                />
              </div>
              {errors.ssoIdentifier ? (
                <p className="mt-1 text-[11px] text-destructive">{errors.ssoIdentifier}</p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  This email is used to identify the user via your SSO provider.
                </p>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="mb-2 block text-[12px] font-medium text-foreground">
                Role <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      value: "Read/Write Administrator",
                      label: "Read / Write",
                      description: "Full management access — create, edit, delete across all areas.",
                      icon: ShieldCheck,
                      activeColor: "border-primary bg-primary/10",
                      iconColor: "text-primary",
                      badgeColor: "bg-primary",
                    },
                    {
                      value: "Read-Only Administrator",
                      label: "Read Only",
                      description: "View all data and reports. Cannot make any changes.",
                      icon: ShieldAlert,
                      activeColor: "border-warning bg-warning/10",
                      iconColor: "text-warning",
                      badgeColor: "bg-warning",
                    },
                  ] as const
                ).map((opt) => {
                  const isSelected = form.role === opt.value
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
                      className={cn(
                        "relative flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-all",
                        isSelected
                          ? opt.activeColor
                          : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40",
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg",
                            isSelected ? opt.activeColor : "bg-muted",
                          )}
                        >
                          <Icon className={cn("h-4 w-4", isSelected ? opt.iconColor : "text-muted-foreground")} />
                        </div>
                        {isSelected && (
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-full text-white",
                              opt.badgeColor,
                            )}
                          >
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <p className={cn("text-[12px] font-semibold", isSelected ? "text-foreground" : "text-foreground")}>
                        {opt.label}
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">{opt.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-foreground">Status</label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Are you sure you want to remove this administrator? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
