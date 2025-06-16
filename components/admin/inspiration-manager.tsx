"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  Save,
  X,
  Link,
  Crop,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Slider } from "@/components/ui/slider"
import { db, type InspirationData } from "@/lib/database"

interface InspirationManagerProps {
  onInspirationSaved?: () => void
}

interface CropSettings {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export function InspirationManager({ onInspirationSaved }: InspirationManagerProps) {
  const [inspirations, setInspirations] = useState<InspirationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingInspiration, setEditingInspiration] = useState<InspirationData | null>(null)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("upload")
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({})
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scale: 100,
  })
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropImageRef = useRef<HTMLImageElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    category: "living-room",
    tags: "",
    isActive: true,
    sortOrder: 0,
    cropSettings: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      scale: 100,
    },
    displaySize: "medium", // small, medium, large
  })

  useEffect(() => {
    loadInspirations()
  }, [])

  // Resolve db:// URLs for display
  useEffect(() => {
    const resolveImages = async () => {
      const newResolvedImages: Record<string, string> = {}

      for (const inspiration of inspirations) {
        if (inspiration.image.startsWith("db://")) {
          try {
            const resolvedUrl = await db.resolveFileUrl(inspiration.image)
            newResolvedImages[inspiration.image] = resolvedUrl
          } catch (error) {
            console.error("Error resolving image:", error)
            newResolvedImages[inspiration.image] = "/placeholder.svg?height=60&width=80&text=Error"
          }
        }
      }

      setResolvedImages(newResolvedImages)
    }

    if (inspirations.length > 0) {
      resolveImages()
    }
  }, [inspirations])

  const loadInspirations = async () => {
    try {
      setIsLoading(true)
      await db.init()
      const loadedInspirations = await db.getInspirations()
      setInspirations(loadedInspirations)
    } catch (error) {
      console.error("Error loading inspirations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingInspiration(null)
    setFormData({
      title: "",
      description: "",
      image: "",
      category: "living-room",
      tags: "",
      isActive: true,
      sortOrder: inspirations.length,
      cropSettings: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        scale: 100,
      },
      displaySize: "medium",
    })
    setShowDialog(true)
  }

  const handleEdit = (inspiration: InspirationData) => {
    setEditingInspiration(inspiration)
    setFormData({
      title: inspiration.title,
      description: inspiration.description,
      image: inspiration.image,
      category: inspiration.category,
      tags: inspiration.tags.join(", "),
      isActive: inspiration.isActive,
      sortOrder: inspiration.sortOrder,
      cropSettings: (inspiration as any).cropSettings || {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        scale: 100,
      },
      displaySize: inspiration.displaySize || "medium",
    })
    setShowDialog(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string

        // Save to database as a file
        const fileId = `inspiration-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const fileData = {
          id: fileId,
          componentId: "inspiration",
          type: "image" as const,
          data: base64Data,
          filename: file.name,
          mimeType: file.type,
          createdAt: new Date(),
        }

        await db.saveFile(fileData)

        // Update form with db:// reference
        setFormData((prev) => ({
          ...prev,
          image: `db://${fileId}`,
        }))

        console.log("Inspiration image uploaded:", fileId)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading inspiration image:", error)
      alert("Error uploading image")
    }
  }

  const openCropDialog = async (imageUrl: string) => {
    try {
      let url = imageUrl
      if (imageUrl.startsWith("db://")) {
        url = await db.resolveFileUrl(imageUrl)
      }
      setCropPreviewUrl(url)
      setCropSettings(formData.cropSettings)
      setShowCropDialog(true)
    } catch (error) {
      console.error("Error opening crop dialog:", error)
    }
  }

  const handleCropSave = () => {
    setFormData((prev) => ({
      ...prev,
      cropSettings: { ...cropSettings },
    }))
    setShowCropDialog(false)
  }

  const updateCropPreview = () => {
    if (!cropCanvasRef.current || !cropImageRef.current || !cropImageRef.current.complete) return

    const canvas = cropCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scaled dimensions
    const scaleFactor = cropSettings.scale / 100
    const scaledWidth = cropImageRef.current.naturalWidth * scaleFactor
    const scaledHeight = cropImageRef.current.naturalHeight * scaleFactor

    // Calculate crop area
    const cropX = (cropSettings.x / 100) * scaledWidth
    const cropY = (cropSettings.y / 100) * scaledHeight
    const cropWidth = (cropSettings.width / 100) * scaledWidth
    const cropHeight = (cropSettings.height / 100) * scaledHeight

    // Draw cropped image
    ctx.drawImage(cropImageRef.current, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    if (cropPreviewUrl && cropImageRef.current) {
      cropImageRef.current.onload = updateCropPreview
      updateCropPreview()
    }
  }, [cropPreviewUrl, cropSettings])

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a title")
      return
    }

    if (!formData.description.trim()) {
      alert("Please enter a description")
      return
    }

    if (!formData.image.trim()) {
      alert("Please select an image")
      return
    }

    try {
      const inspiration: InspirationData = {
        id: editingInspiration?.id || `inspiration-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        image: formData.image,
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
        displaySize: formData.displaySize as 'small' | 'medium' | 'large',
        createdAt: editingInspiration?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      await db.saveInspiration(inspiration)

      if (editingInspiration) {
        setInspirations(inspirations.map((insp) => (insp.id === inspiration.id ? inspiration : insp)))
      } else {
        setInspirations([...inspirations, inspiration])
      }

      setShowDialog(false)
      onInspirationSaved?.()
      console.log("Inspiration saved:", inspiration.id)
    } catch (error) {
      console.error("Error saving inspiration:", error)
      alert("Error saving inspiration")
    }
  }

  const handleDelete = async (inspirationId: string) => {
    const inspiration = inspirations.find((insp) => insp.id === inspirationId)
    const confirmMessage = inspiration
      ? `Are you sure you want to delete "${inspiration.title}"?`
      : "Are you sure you want to delete this inspiration item?"

    if (!confirm(confirmMessage)) return

    // TODO: Implement deleteInspiration in db if needed. For now, just filter from state.

    setInspirations(inspirations.filter((insp) => insp.id !== inspirationId))
    console.log("Inspiration deleted:", inspirationId)
  }

  const handleToggleActive = async (inspiration: InspirationData) => {
    try {
      const updated = { ...inspiration, isActive: !inspiration.isActive, updatedAt: new Date() }
      await db.saveInspiration(updated)
      setInspirations(inspirations.map((insp) => (insp.id === inspiration.id ? updated : insp)))
    } catch (error) {
      console.error("Error toggling inspiration active state:", error)
    }
  }

  const handleMoveUp = async (inspiration: InspirationData) => {
    const currentIndex = inspirations.findIndex((insp) => insp.id === inspiration.id)
    if (currentIndex <= 0) return

    const newInspirations = [...inspirations]
    const temp = newInspirations[currentIndex]
    newInspirations[currentIndex] = newInspirations[currentIndex - 1]
    newInspirations[currentIndex - 1] = temp

    // Update sort orders
    newInspirations.forEach((insp, index) => {
      insp.sortOrder = index
    })

    try {
      // Save updated sort orders
      for (const insp of newInspirations) {
        await db.saveInspiration({ ...insp, updatedAt: new Date() })
      }
      setInspirations(newInspirations)
    } catch (error) {
      console.error("Error updating sort order:", error)
    }
  }

  const handleMoveDown = async (inspiration: InspirationData) => {
    const currentIndex = inspirations.findIndex((insp) => insp.id === inspiration.id)
    if (currentIndex >= inspirations.length - 1) return

    const newInspirations = [...inspirations]
    const temp = newInspirations[currentIndex]
    newInspirations[currentIndex] = newInspirations[currentIndex + 1]
    newInspirations[currentIndex + 1] = temp

    // Update sort orders
    newInspirations.forEach((insp, index) => {
      insp.sortOrder = index
    })

    try {
      // Save updated sort orders
      for (const insp of newInspirations) {
        await db.saveInspiration({ ...insp, updatedAt: new Date() })
      }
      setInspirations(newInspirations)
    } catch (error) {
      console.error("Error updating sort order:", error)
    }
  }

  const getImagePreview = (imageUrl: string) => {
    if (imageUrl.startsWith("db://")) {
      // Return resolved image or loading placeholder
      return resolvedImages[imageUrl] || "/placeholder.svg?height=60&width=80&text=Loading"
    }
    return imageUrl || "/placeholder.svg?height=60&width=80&text=No+Image"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Loading inspirations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lighting Inspiration Management ({inspirations.length}/30 items)</span>
            <Button onClick={handleCreate} disabled={inspirations.length >= 30}>
              <Plus className="w-4 h-4 mr-2" />
              Add Inspiration
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspirations.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No inspiration items found. Create some to showcase lighting ideas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspirations.map((inspiration, index) => (
                  <TableRow key={inspiration.id}>
                    <TableCell>
                      <img
                        src={getImagePreview(inspiration.image) || "/placeholder.svg"}
                        alt={inspiration.title}
                        className="w-20 h-15 object-cover rounded border"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=60&width=80&text=Error"
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{inspiration.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{inspiration.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{inspiration.displaySize || "medium"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={inspiration.isActive}
                          onCheckedChange={() => handleToggleActive(inspiration)}
                        />
                        {inspiration.isActive ? (
                          <Eye className="w-4 h-4 text-green-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{index + 1}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveUp(inspiration)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveDown(inspiration)}
                            disabled={index === inspirations.length - 1}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(inspiration)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(inspiration.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInspiration ? "Edit Inspiration" : "Add New Inspiration"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Modern Living Room"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  title="Category"
                >
                  <option value="living-room">Living Room</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="bedroom">Bedroom</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="office">Office</option>
                  <option value="dining-room">Dining Room</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the lighting setup and atmosphere..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Display Size</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={formData.displaySize === "small" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, displaySize: "small" })}
                  className="flex-1"
                >
                  Small
                </Button>
                <Button
                  type="button"
                  variant={formData.displaySize === "medium" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, displaySize: "medium" })}
                  className="flex-1"
                >
                  Medium
                </Button>
                <Button
                  type="button"
                  variant={formData.displaySize === "large" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, displaySize: "large" })}
                  className="flex-1"
                >
                  Large
                </Button>
              </div>
            </div>

            <div>
              <Label>Image</Label>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={uploadMethod === "upload" ? "default" : "outline"}
                    onClick={() => setUploadMethod("upload")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMethod === "url" ? "default" : "outline"}
                    onClick={() => setUploadMethod("url")}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Use URL
                  </Button>
                </div>

                {uploadMethod === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                      aria-label="Upload inspiration image file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click()
                        }
                      }}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image File
                    </Button>
                  </div>
                ) : (
                  <Input
                    value={formData.image.startsWith("db://") ? "" : formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value.trim() })}
                    placeholder="https://example.com/image.jpg"
                    onBlur={(e) => {
                      const url = e.target.value.trim()
                      if (url && !url.startsWith("http")) {
                        setFormData({ ...formData, image: `https://${url}` })
                      }
                    }}
                  />
                )}

                {formData.image && (
                  <div className="border rounded p-2">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">Preview:</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCropDialog(formData.image)}
                        className="flex items-center gap-1"
                      >
                        <Crop className="w-3 h-3 mr-1" />
                        Adjust Crop
                      </Button>
                    </div>
                    <FormImagePreview imageUrl={formData.image} cropSettings={formData.cropSettings} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="modern, pendant, track lighting, ambient"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active (visible in carousel)</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.description.trim() || !formData.image.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingInspiration ? "Update" : "Create"} Inspiration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust Image Crop</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative border rounded-md overflow-hidden" style={{ minHeight: "300px" }}>
                <img
                  ref={cropImageRef}
                  src={cropPreviewUrl || "/placeholder.svg"}
                  alt="Original"
                  className="max-w-full"
                  style={{ opacity: 0.7 }}
                  onLoad={updateCropPreview}
                />
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
                  style={{
                    top: `${cropSettings.y}%`,
                    left: `${cropSettings.x}%`,
                    width: `${cropSettings.width}%`,
                    height: `${cropSettings.height}%`,
                  }}
                ></div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Label>Preview</Label>
                  <div className="border rounded-md overflow-hidden mt-2">
                    <canvas ref={cropCanvasRef} width={300} height={200} className="w-full"></canvas>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="flex justify-between">
                      <span>Position X: {cropSettings.x}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.x]}
                      min={0}
                      max={100 - cropSettings.width}
                      step={1}
                      onValueChange={(value) => setCropSettings({ ...cropSettings, x: value[0] })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="flex justify-between">
                      <span>Position Y: {cropSettings.y}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.y]}
                      min={0}
                      max={100 - cropSettings.height}
                      step={1}
                      onValueChange={(value) => setCropSettings({ ...cropSettings, y: value[0] })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="flex justify-between">
                      <span>Width: {cropSettings.width}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.width]}
                      min={10}
                      max={100 - cropSettings.x}
                      step={1}
                      onValueChange={(value) => setCropSettings({ ...cropSettings, width: value[0] })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="flex justify-between">
                      <span>Height: {cropSettings.height}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.height]}
                      min={10}
                      max={100 - cropSettings.y}
                      step={1}
                      onValueChange={(value) => setCropSettings({ ...cropSettings, height: value[0] })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="flex justify-between">
                      <span>Scale: {cropSettings.scale}%</span>
                    </Label>
                    <Slider
                      value={[cropSettings.scale]}
                      min={50}
                      max={200}
                      step={5}
                      onValueChange={(value) => setCropSettings({ ...cropSettings, scale: value[0] })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowCropDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCropSave}>
                <Save className="w-4 h-4 mr-2" />
                Apply Crop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component to handle async image preview in the form with crop settings
function FormImagePreview({ imageUrl, cropSettings }: { imageUrl: string; cropSettings: CropSettings }) {
  const [resolvedUrl, setResolvedUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const resolveImage = async () => {
      setIsLoading(true)
      try {
        if (imageUrl.startsWith("db://")) {
          const resolved = await db.resolveFileUrl(imageUrl)
          setResolvedUrl(resolved)
        } else {
          setResolvedUrl(imageUrl)
        }
      } catch (error) {
        console.error("Error resolving form image:", error)
        setResolvedUrl("/placeholder.svg?height=400&width=600&text=Error")
      } finally {
        setIsLoading(false)
      }
    }

    if (imageUrl) {
      resolveImage()
    }
  }, [imageUrl])

  useEffect(() => {
    if (resolvedUrl && !isLoading && canvasRef.current && imageRef.current) {
      const img = imageRef.current
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Calculate scaled dimensions
        const scaleFactor = cropSettings.scale / 100
        const scaledWidth = img.naturalWidth * scaleFactor
        const scaledHeight = img.naturalHeight * scaleFactor

        // Calculate crop area
        const cropX = (cropSettings.x / 100) * scaledWidth
        const cropY = (cropSettings.y / 100) * scaledHeight
        const cropWidth = (cropSettings.width / 100) * scaledWidth
        const cropHeight = (cropSettings.height / 100) * scaledHeight

        // Draw cropped image
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)
      }
    }
  }, [resolvedUrl, isLoading, cropSettings])

  if (isLoading) {
    return (
      <div className="w-full max-w-md h-48 bg-gray-100 rounded flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 mx-auto mb-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading image...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <img
        ref={imageRef}
        src={resolvedUrl || "/placeholder.svg"}
        alt="Original"
        style={{ display: "none" }}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = "/placeholder.svg?height=400&width=600&text=Error"
        }}
      />
      <canvas ref={canvasRef} width={400} height={300} className="w-full max-w-md h-48 object-cover rounded" />
    </div>
  )
}
