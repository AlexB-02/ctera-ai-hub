"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, ExternalLink, ChevronDown, Search, FileText, Star } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { useHub } from "@/components/hub-provider"
import { getDownloadsProductIcon } from "@/lib/lucide-icon-map"

export default function DownloadsPage() {
  const { hub } = useHub()
  const { versionData, products } = hub.downloads

  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSurvey, setShowSurvey] = useState(false)
  const [downloadAction, setDownloadAction] = useState<"download" | "generate">("download")
  const [siteRating, setSiteRating] = useState(0)
  const [productRating, setProductRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, "windows" | "mac">>({
    "CTERA Drive": "windows",
    "CTERA Drive Connect": "windows",
  })

  const toggleExpanded = (productName: string) => {
    setExpandedCard((prev) => (prev === productName ? null : productName))
    setSearchQuery("")
  }

  const getFilteredVersions = (productName: string) => {
    const product = products.find((p) => p.name === productName)
    let versionKey = productName

    if (product?.hasPlatformSelector) {
      const platform = selectedPlatforms[productName]
      versionKey = `${productName} - ${platform === "windows" ? "Windows" : "Mac"}`
    }

    const versions = versionData[versionKey] || []
    const query = searchQuery.toLowerCase()
    if (!query) return versions
    return versions.filter(
      (v) =>
        v.version.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query) ||
        v.released.includes(query),
    )
  }

  const handleDownloadOrGenerate = (action: "download" | "generate") => {
    setDownloadAction(action)
    setShowSurvey(true)
  }

  const handleSurveySubmit = () => {
    console.log("[v0] Survey submitted:", { siteRating, productRating, feedback, action: downloadAction })
    setShowSurvey(false)
    setSiteRating(0)
    setProductRating(0)
    setFeedback("")
  }

  const handlePlatformChange = (productName: string, platform: "windows" | "mac") => {
    setSelectedPlatforms((prev) => ({ ...prev, [productName]: platform }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="border-b bg-card">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-semibold text-foreground">CTERA Download Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">Download the latest versions of all CTERA products</p>
          </div>
        </div>

        <div className="p-8">
          {expandedCard && (
            <Card className="mb-6">
              {(() => {
                const product = products.find((p) => p.name === expandedCard)
                if (!product) return null
                const ProductMarkIcon =
                  "icon" in product && (product as { icon?: string }).icon
                    ? getDownloadsProductIcon((product as { icon?: string }).icon)
                    : null

                return (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                            {product.iconUrl ? (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                <Image
                                  src={product.iconUrl || "/placeholder.svg"}
                                  alt={product.name}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 object-contain"
                                />
                              </div>
                            ) : ProductMarkIcon ? (
                              <ProductMarkIcon className="h-8 w-8 text-muted-foreground" />
                            ) : null}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            {product.hasPlatformSelector && (
                              <div className="mt-2 flex gap-2">
                                <Button
                                  variant={selectedPlatforms[product.name] === "windows" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePlatformChange(product.name, "windows")}
                                >
                                  Windows
                                </Button>
                                <Button
                                  variant={selectedPlatforms[product.name] === "mac" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePlatformChange(product.name, "mac")}
                                >
                                  Mac
                                </Button>
                              </div>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <span
                                className={`font-medium ${
                                  product.status === "success"
                                    ? "text-success"
                                    : product.status === "warning"
                                      ? "text-warning"
                                      : "text-critical"
                                }`}
                              >
                                {product.progressLabel}
                              </span>
                            </div>
                            <Progress
                              value={product.progress}
                              className="mt-2 h-1.5 w-[200px]"
                              indicatorClassName={
                                product.status === "success"
                                  ? "bg-success"
                                  : product.status === "warning"
                                    ? "bg-warning"
                                    : "bg-critical"
                              }
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                              <div className="text-xs text-muted-foreground">GA</div>
                              <div className="text-sm font-semibold">{product.version}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Released</div>
                              <div className="text-sm font-medium">{product.released}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Size</div>
                              <div className="text-sm font-medium">{product.size}</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-transparent"
                              onClick={() => handleDownloadOrGenerate("generate")}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Generate Link
                            </Button>
                            <Button size="sm" onClick={() => handleDownloadOrGenerate("download")}>
                              <Download className="mr-2 h-4 w-4" />
                              Get Latest Version
                            </Button>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>
                    </CardHeader>

                    <CardContent>
                      <Button
                        variant="outline"
                        className="mb-4 w-full bg-transparent"
                        onClick={() => toggleExpanded(product.name)}
                      >
                        Hide versions
                        <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                      </Button>

                      <div className="space-y-4 rounded-lg border bg-muted/30 p-6">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">Version Lookup</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Enter a version number to check if it's available and get installation recommendations
                        </p>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label htmlFor="version-search" className="mb-1.5 block text-sm font-medium">
                              Version Number
                            </label>
                            <Input
                              id="version-search"
                              placeholder="e.g. 8.3.3000 or 7.2.0-beta.1"
                              className="h-10"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                          <Button className="mt-6" onClick={() => {}}>
                            <Search className="mr-2 h-4 w-4" />
                            Check Version
                          </Button>
                        </div>

                        <div className="mt-6 flex items-center gap-8 border-b pb-4">
                          <button className="flex items-center gap-2 border-b-2 border-primary pb-4 text-sm font-medium">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                            General Availability (GA)
                          </button>
                          <button className="flex items-center gap-2 pb-4 text-sm text-muted-foreground">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/30" />
                            Security Patches
                          </button>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-success">
                                <div className="h-2 w-2 rounded-full bg-success" />
                              </div>
                              <span className="text-sm font-medium">General Availability (GA)</span>
                              <span className="rounded bg-muted px-2 py-0.5 text-xs">Stable Releases</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {getFilteredVersions(product.name).map((version, vIndex) => (
                              <Card key={vIndex}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-3">
                                        <span className="text-base font-semibold">{version.version}</span>
                                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">GA</span>
                                        {version.platform && (
                                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                                            {version.platform === "windows" ? "Windows" : "Mac"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{version.released}</span>
                                        <span>{version.size}</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{version.description}</p>
                                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Release Notes
                                      </Button>
                                    </div>
                                    <div className="ml-4 flex flex-col gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-transparent"
                                        onClick={() => handleDownloadOrGenerate("generate")}
                                      >
                                        Generate Link
                                      </Button>
                                      <Button size="sm" onClick={() => handleDownloadOrGenerate("download")}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Get Latest Version
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )
              })()}
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products
              .filter((p) => p.name !== expandedCard)
              .map((product, index) => {
                const ProductMarkIcon =
                  "icon" in product && (product as { icon?: string }).icon
                    ? getDownloadsProductIcon((product as { icon?: string }).icon)
                    : null
                return (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                        {product.iconUrl ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <Image
                              src={product.iconUrl || "/placeholder.svg"}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                        ) : ProductMarkIcon ? (
                          <ProductMarkIcon className="h-8 w-8 text-muted-foreground" />
                        ) : null}
                      </div>
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      {product.hasPlatformSelector && (
                        <div className="flex gap-2">
                          <Button
                            variant={selectedPlatforms[product.name] === "windows" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePlatformChange(product.name, "windows")}
                          >
                            Windows
                          </Button>
                          <Button
                            variant={selectedPlatforms[product.name] === "mac" ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePlatformChange(product.name, "mac")}
                          >
                            Mac
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span
                          className={`font-medium ${
                            product.status === "success"
                              ? "text-success"
                              : product.status === "warning"
                                ? "text-warning"
                                : "text-critical"
                          }`}
                        >
                          {product.progressLabel}
                        </span>
                      </div>
                      <Progress
                        value={product.progress}
                        className="h-2"
                        indicatorClassName={
                          product.status === "success"
                            ? "bg-success"
                            : product.status === "warning"
                              ? "bg-warning"
                              : "bg-critical"
                        }
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">GA</div>
                        <div className="text-xs font-semibold">{product.version}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Released</div>
                        <div className="text-xs font-medium">{product.released}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Size</div>
                        <div className="text-xs font-medium">{product.size}</div>
                      </div>
                    </div>

                    <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>

                    <div className="mt-auto flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => handleDownloadOrGenerate("generate")}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Generate Link
                      </Button>
                      <Button size="sm" onClick={() => handleDownloadOrGenerate("download")}>
                        <Download className="mr-2 h-3 w-3" />
                        Get Latest Version
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => toggleExpanded(product.name)}
                      >
                        More versions
                        <ChevronDown className="ml-2 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})}
          </div>
        </div>
      </main>

      <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>How was your experience?</DialogTitle>
            <DialogDescription>Help us improve by sharing your feedback</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>How would you rate this website?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSiteRating(rating)}
                    className="transition-colors hover:text-primary"
                  >
                    <Star
                      className={`h-6 w-6 ${rating <= siteRating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>How would you rate the product?</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setProductRating(rating)}
                    className="transition-colors hover:text-primary"
                  >
                    <Star
                      className={`h-6 w-6 ${rating <= productRating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional feedback (optional)</Label>
              <Textarea
                placeholder="Share your thoughts..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSurvey(false)} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleSurveySubmit} className="flex-1">
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
