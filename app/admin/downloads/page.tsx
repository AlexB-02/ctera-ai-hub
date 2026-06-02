"use client"

import { useState, useRef, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Trash2,
  Upload,
  Search,
  Download,
  FileText,
  Edit2,
  Check,
  X,
} from "lucide-react"

type FileEntry = {
  id: string
  name: string
  version: string
  category: string
  size: string
  released: string
  downloads: number
  visible: boolean
}

const initialFiles: FileEntry[] = [
  { id: "1", name: "CTERA Portal", version: "8.3.3000", category: "Server", size: "245 MB", released: "2024-01-15", downloads: 1842, visible: true },
  { id: "2", name: "CTERA Portal", version: "8.2.2800", category: "Server", size: "243 MB", released: "2024-01-01", downloads: 630, visible: true },
  { id: "3", name: "CTERA Edge Filer", version: "7.11.5100", category: "Appliance", size: "156 MB", released: "2024-01-10", downloads: 924, visible: true },
  { id: "4", name: "CTERA Edge Filer", version: "7.11.5000", category: "Appliance", size: "155 MB", released: "2023-12-20", downloads: 412, visible: true },
  { id: "5", name: "CTERA Drive - Windows", version: "5.2.1", category: "Client", size: "89 MB", released: "2024-01-12", downloads: 3210, visible: true },
  { id: "6", name: "CTERA Drive - macOS", version: "5.2.1", category: "Client", size: "76 MB", released: "2024-01-12", downloads: 1540, visible: true },
  { id: "7", name: "CTERA Mobile - iOS", version: "4.1.2", category: "Mobile", size: "12 MB", released: "2024-01-08", downloads: 2780, visible: true },
  { id: "8", name: "CTERA Mobile - Android", version: "4.1.2", category: "Mobile", size: "14 MB", released: "2024-01-08", downloads: 1890, visible: true },
  { id: "9", name: "CTERA Connect", version: "2.3.0", category: "Client", size: "34 MB", released: "2023-12-10", downloads: 765, visible: false },
  { id: "10", name: "Legacy Portal Backup", version: "7.5.0", category: "Server", size: "198 MB", released: "2023-06-01", downloads: 88, visible: false },
]

const categories = ["All", "Server", "Appliance", "Client", "Mobile"]

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function parseVersionFromFileName(name: string) {
  const m = name.match(/(\d+\.\d+\.\d+[^\s._]*)/) ?? name.match(/(\d+\.\d+)/)
  return m ? m[1] : "—"
}

const VALID_IMPORT_CATEGORIES = ["Server", "Appliance", "Client", "Mobile"] as const

function normalizeImportedEntry(raw: Record<string, unknown>): FileEntry | null {
  if (typeof raw.name !== "string" || typeof raw.version !== "string") return null
  const cat =
    typeof raw.category === "string" && (VALID_IMPORT_CATEGORIES as readonly string[]).includes(raw.category)
      ? raw.category
      : "Server"
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: raw.name,
    version: raw.version,
    category: cat,
    size: typeof raw.size === "string" ? raw.size : "—",
    released: typeof raw.released === "string" ? raw.released : new Date().toISOString().split("T")[0],
    downloads: typeof raw.downloads === "number" ? raw.downloads : 0,
    visible: raw.visible !== false,
  }
}

export default function AdminDownloadsPage() {
  const [files, setFiles] = useState<FileEntry[]>(initialFiles)
  const [dropActive, setDropActive] = useState(false)
  const dropDepth = useRef(0)
  const filePickerRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<FileEntry>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFile, setNewFile] = useState<Partial<FileEntry>>({
    name: "", version: "", category: "Server", size: "", released: new Date().toISOString().split("T")[0], visible: true,
  })

  const filtered = files.filter((f) => {
    const matchQuery =
      !query ||
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.version.toLowerCase().includes(query.toLowerCase()) ||
      f.category.toLowerCase().includes(query.toLowerCase())
    const matchCat = selectedCategory === "All" || f.category === selectedCategory
    return matchQuery && matchCat
  })

  const toggleVisibility = (id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)))
  }

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const startEdit = (file: FileEntry) => {
    setEditingId(file.id)
    setEditValues({ name: file.name, version: file.version, size: file.size, released: file.released })
  }

  const saveEdit = (id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...editValues } : f)))
    setEditingId(null)
    setEditValues({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({})
  }

  const ingestBrowserFiles = useCallback(async (list: FileList | File[]) => {
    const browserFiles = [...list].filter((f) => f.size > 0 || f.name.endsWith(".json"))
    const newEntries: FileEntry[] = []

    for (const file of browserFiles) {
      const isJson = file.name.toLowerCase().endsWith(".json") || file.type === "application/json"
      if (isJson) {
        try {
          const data: unknown = JSON.parse(await file.text())
          const arr = Array.isArray(data)
            ? data
            : data &&
                typeof data === "object" &&
                "files" in data &&
                Array.isArray((data as { files: unknown }).files)
              ? (data as { files: unknown[] }).files
              : [data]
          for (const item of arr) {
            if (item && typeof item === "object") {
              const row = normalizeImportedEntry(item as Record<string, unknown>)
              if (row) newEntries.push(row)
            }
          }
        } catch {
          /* invalid JSON — skip */
        }
        continue
      }

      const baseName = file.name.replace(/\.[^/.]+$/, "")
      newEntries.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: baseName || file.name,
        version: parseVersionFromFileName(file.name),
        category: "Client",
        size: formatBytes(file.size),
        released: new Date().toISOString().split("T")[0],
        downloads: 0,
        visible: true,
      })
    }

    if (newEntries.length) {
      setFiles((prev) => [...newEntries, ...prev])
    }
  }, [])

  const onDropZoneDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropDepth.current += 1
    setDropActive(true)
  }

  const onDropZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropDepth.current -= 1
    if (dropDepth.current <= 0) {
      dropDepth.current = 0
      setDropActive(false)
    }
  }

  const onDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }

  const onDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dropDepth.current = 0
    setDropActive(false)
    const { files: dtFiles } = e.dataTransfer
    if (dtFiles?.length) void ingestBrowserFiles(dtFiles)
  }

  const addFile = () => {
    if (!newFile.name || !newFile.version) return
    const entry: FileEntry = {
      id: Date.now().toString(),
      name: newFile.name!,
      version: newFile.version!,
      category: newFile.category || "Server",
      size: newFile.size || "—",
      released: newFile.released || new Date().toISOString().split("T")[0],
      downloads: 0,
      visible: newFile.visible ?? true,
    }
    setFiles((prev) => [entry, ...prev])
    setNewFile({ name: "", version: "", category: "Server", size: "", released: new Date().toISOString().split("T")[0], visible: true })
    setShowAddForm(false)
  }

  const visibleCount = files.filter((f) => f.visible).length
  const totalDownloads = files.reduce((s, f) => s + f.downloads, 0)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <TopBar title="Downloads Center" subtitle="Manage files available to tenants" />

        <div className="p-8 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total files" value={files.length} />
            <StatCard label="Published" value={visibleCount} accent="text-emerald-600" />
            <StatCard label="Total downloads" value={totalDownloads.toLocaleString()} />
          </div>

          {/* Controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-[15px] font-semibold">File library</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Category filter */}
                  <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                          selectedCategory === cat
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 w-56">
                    <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search files..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>

                  <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add file
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div className="px-4 pb-4">
              <input
                ref={filePickerRef}
                type="file"
                multiple
                className="hidden"
                accept=".json,application/json,*/*"
                onChange={(e) => {
                  const picked = e.target.files
                  if (picked?.length) void ingestBrowserFiles(picked)
                  e.target.value = ""
                }}
              />
              <div
                role="region"
                aria-label="Drop files to add to the library"
                onDragEnter={onDropZoneDragEnter}
                onDragLeave={onDropZoneDragLeave}
                onDragOver={onDropZoneDragOver}
                onDrop={onDropZoneDrop}
                onClick={() => filePickerRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    filePickerRef.current?.click()
                  }
                }}
                tabIndex={0}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dropActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:border-muted-foreground/40 hover:bg-muted/30",
                )}
              >
                <Upload className={cn("h-8 w-8", dropActive ? "text-primary" : "text-muted-foreground")} />
                <div className="text-[13px] font-medium text-foreground">
                  Drop files here or click to browse
                </div>
                <p className="max-w-md text-[12px] text-muted-foreground leading-snug">
                  Non-JSON files are added as library rows (name from filename, size from file, version guessed when possible).
                  Drop a <span className="font-medium text-foreground">.json</span> catalog: an array of objects with{" "}
                  <span className="font-mono text-[11px]">name</span>, <span className="font-mono text-[11px]">version</span>
                  , and optional <span className="font-mono text-[11px]">category</span>, <span className="font-mono text-[11px]">size</span>,{" "}
                  <span className="font-mono text-[11px]">released</span>, <span className="font-mono text-[11px]">downloads</span>,{" "}
                  <span className="font-mono text-[11px]">visible</span>.
                </p>
              </div>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="mx-4 mb-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-3 text-[13px] font-medium text-foreground">New file entry</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Name</label>
                    <input
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                      value={newFile.name}
                      onChange={(e) => setNewFile((p) => ({ ...p, name: e.target.value }))}
                      placeholder="CTERA Portal"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Version</label>
                    <input
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                      value={newFile.version}
                      onChange={(e) => setNewFile((p) => ({ ...p, version: e.target.value }))}
                      placeholder="8.3.3000"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Category</label>
                    <select
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                      value={newFile.category}
                      onChange={(e) => setNewFile((p) => ({ ...p, category: e.target.value }))}
                    >
                      {categories.filter((c) => c !== "All").map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Size</label>
                    <input
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                      value={newFile.size}
                      onChange={(e) => setNewFile((p) => ({ ...p, size: e.target.value }))}
                      placeholder="120 MB"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Release date</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                      value={newFile.released}
                      onChange={(e) => setNewFile((p) => ({ ...p, released: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFile.visible}
                      onChange={(e) => setNewFile((p) => ({ ...p, visible: e.target.checked }))}
                      className="rounded"
                    />
                    Publish immediately
                  </label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
                    <Button size="sm" onClick={addFile} className="gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      Add file
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-border bg-muted/40 text-left">
                      <Th>File</Th>
                      <Th>Category</Th>
                      <Th>Version</Th>
                      <Th>Size</Th>
                      <Th>Released</Th>
                      <Th className="text-right">Downloads</Th>
                      <Th>Visibility</Th>
                      <Th className="w-px"></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((file) => {
                      const isEditing = editingId === file.id
                      return (
                        <tr
                          key={file.id}
                          className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20"
                        >
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              {isEditing ? (
                                <input
                                  className="rounded-md border border-border bg-card px-2 py-1 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring w-40"
                                  value={editValues.name ?? ""}
                                  onChange={(e) => setEditValues((p) => ({ ...p, name: e.target.value }))}
                                />
                              ) : (
                                <span className="text-[13px] font-medium text-foreground">{file.name}</span>
                              )}
                            </div>
                          </Td>
                          <Td>
                            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {file.category}
                            </span>
                          </Td>
                          <Td>
                            {isEditing ? (
                              <input
                                className="rounded-md border border-border bg-card px-2 py-1 text-[12px] text-foreground outline-none focus:ring-1 focus:ring-ring w-28"
                                value={editValues.version ?? ""}
                                onChange={(e) => setEditValues((p) => ({ ...p, version: e.target.value }))}
                              />
                            ) : (
                              <span className="text-[12px] tabular-nums text-muted-foreground">{file.version}</span>
                            )}
                          </Td>
                          <Td>
                            {isEditing ? (
                              <input
                                className="rounded-md border border-border bg-card px-2 py-1 text-[12px] text-foreground outline-none focus:ring-1 focus:ring-ring w-24"
                                value={editValues.size ?? ""}
                                onChange={(e) => setEditValues((p) => ({ ...p, size: e.target.value }))}
                              />
                            ) : (
                              <span className="text-[12px] tabular-nums text-muted-foreground">{file.size}</span>
                            )}
                          </Td>
                          <Td>
                            {isEditing ? (
                              <input
                                type="date"
                                className="rounded-md border border-border bg-card px-2 py-1 text-[12px] text-foreground outline-none focus:ring-1 focus:ring-ring"
                                value={editValues.released ?? ""}
                                onChange={(e) => setEditValues((p) => ({ ...p, released: e.target.value }))}
                              />
                            ) : (
                              <span className="text-[12px] tabular-nums text-muted-foreground">{file.released}</span>
                            )}
                          </Td>
                          <Td className="text-right">
                            <div className="flex items-center justify-end gap-1 text-[12px] tabular-nums text-muted-foreground">
                              <Download className="h-3 w-3" />
                              {file.downloads.toLocaleString()}
                            </div>
                          </Td>
                          <Td>
                            <button
                              onClick={() => toggleVisibility(file.id)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                                file.visible
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-border bg-muted text-muted-foreground hover:bg-accent",
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", file.visible ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                              {file.visible ? "Published" : "Hidden"}
                            </button>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(file.id)}
                                    className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(file)}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteFile(file.id)}
                                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </Td>
                        </tr>
                      )
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                          No files match your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, accent = "text-foreground" }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", accent)}>{value}</div>
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>
}
