"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageIcon, Box, ExternalLink, Eye, Download, Edit, Trash2, RefreshCw, Package } from "lucide-react"
import type { ComponentData } from "@/lib/database"

interface ComponentDetailsViewProps {
  components: ComponentData[]
  onEdit?: (component: ComponentData) => void
  onDelete?: (componentId: string) => void
  onRefresh?: () => void
}

export function ComponentDetailsView({ components, onEdit, onDelete, onRefresh }: ComponentDetailsViewProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>("")
  const [previewTitle, setPreviewTitle] = useState<string>("")

  const openImagePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl)
    setPreviewTitle(title)
    setShowImagePreview(true)
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown"
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid Date"

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  }

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewDetails = (component: ComponentData) => {
    setSelectedComponent(component)
    setShowDetails(true)
  }

  const handleEdit = (component: ComponentData) => {
    if (onEdit) {
      onEdit(component)
    }
  }

  const handleDelete = (componentId: string) => {
    if (onDelete) {
      onDelete(componentId)
    }
  }

  if (components.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No Components Found</h3>
          <p className="text-sm mb-4">Start by adding some components to your catalog.</p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Components ({components.length})</h2>
        <div className="flex gap-2">
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>Component Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>3D Model</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded border overflow-hidden">
                        {component.image ? (
                          <img
                            src={component.image || "/placeholder.svg"}
                            alt={component.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=48&width=48&text=No+Image"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{component.name}</div>
                        <div className="text-sm text-gray-500">{component.id}</div>
                        {component.description && (
                          <div className="text-xs text-gray-400 max-w-xs truncate">{component.description}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{component.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">€{component.price.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {component.image && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openImagePreview(component.image!, "Thumbnail")}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                      {component.cardImage && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openImagePreview(component.cardImage!, "Product Image")}
                        >
                          <ImageIcon className="w-3 h-3" />
                        </Button>
                      )}
                      {!component.image && !component.cardImage && (
                        <span className="text-xs text-gray-400">No images</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {component.model3d ? (
                      <Badge variant="secondary" className="text-xs">
                        <Box className="w-3 h-3 mr-1" />
                        3D Model
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">No model</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(component.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(component)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(component)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(component.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      {component.componentUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(component.componentUrl, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Component Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Component Details: {selectedComponent?.name}</DialogTitle>
          </DialogHeader>
          {selectedComponent && <ComponentDetailView component={selectedComponent} />}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={previewImage || "/placeholder.svg"}
              alt={previewTitle}
              className="max-w-full max-h-[70vh] object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=400&width=600&text=Image+Not+Found"
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() =>
                downloadImage(
                  previewImage,
                  `${selectedComponent?.name || "component"}-${previewTitle.toLowerCase().replace(" ", "-")}`,
                )
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => setShowImagePreview(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Separate component for detailed view
function ComponentDetailView({ component }: { component: ComponentData }) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown"
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid Date"

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj)
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Basic Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID:</span>
              <span className="font-mono">{component.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span>{component.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <Badge variant="outline">{component.type}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price:</span>
              <span className="font-semibold">€{component.price.toFixed(2)}</span>
            </div>
            {component.description && (
              <div>
                <span className="text-gray-500">Description:</span>
                <p className="mt-1">{component.description}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Timestamps</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span>{formatDate(component.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Updated:</span>
              <span>{formatDate(component.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div>
        <h3 className="font-semibold mb-2">Images</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Thumbnail</h4>
            {component.image ? (
              <img
                src={component.image || "/placeholder.svg"}
                alt="Thumbnail"
                className="w-full h-32 object-cover rounded border"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                <span className="text-gray-400 text-sm">No thumbnail</span>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Product Image</h4>
            {component.cardImage ? (
              <img
                src={component.cardImage || "/placeholder.svg"}
                alt="Product"
                className="w-full h-32 object-cover rounded border"
              />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                <span className="text-gray-400 text-sm">No product image</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div>
        <h3 className="font-semibold mb-2">Specifications</h3>
        {Object.keys(component.specifications || {}).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(component.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No specifications available</p>
        )}
      </div>
    </div>
  )
}
