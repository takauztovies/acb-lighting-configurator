"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Edit, Trash2, Eye, Save, X, Upload, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { db, type ComponentData, type PresetData } from "@/lib/database"
import { PresetCanvas } from "./preset-canvas"
import { useTranslation } from "@/hooks/use-translation"

interface PresetManagerProps {
  components: ComponentData[]
  onSave: (preset: PresetData) => void
  onDelete: (presetId: string) => void
}

interface PresetFormData {
  name: string
  category: string
  description: string
  roomDimensions: { width: number; length: number; height: number }
  components: { componentId: string; position: [number, number, number]; rotation: [number, number, number] }[]
  previewImage?: string
  photoImage?: string
}

const presetCategories = [
  "Living Room",
  "Kitchen",
  "Office",
  "Bedroom",
  "Bathroom",
  "Retail",
  "Restaurant",
  "Gallery",
  "Studio",
  "Workshop",
  "Custom",
]

export function PresetManager({ components, onSave, onDelete }: PresetManagerProps) {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<PresetData[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingPreset, setEditingPreset] = useState<PresetData | null>(null)
  const [previewPreset, setPreviewPreset] = useState<PresetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load presets from database
  useEffect(() => {
    const loadPresets = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Loading presets...")
        const presetsData = await db.getPresets()
        console.log("Loaded presets:", presetsData.length)
        setPresets(presetsData)
      } catch (error) {
        console.error("Error loading presets:", error)
        setError("Failed to load presets: " + (error as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    loadPresets()
  }, [])

  const handleCreatePreset = useCallback(() => {
    console.log("Creating new preset")
    setEditingPreset(null)
    setIsCreating(true)
  }, [])

  const handleEditPreset = useCallback((preset: PresetData) => {
    console.log("Editing preset:", preset)
    setEditingPreset(preset)
    setIsCreating(true)
  }, [])

  const handleSavePreset = useCallback(
    async (presetData: PresetFormData) => {
      try {
        console.log("Saving preset data:", presetData)

        const preset: PresetData = {
          id: editingPreset?.id || `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: presetData.name,
          category: presetData.category,
          description: presetData.description,
          roomDimensions: presetData.roomDimensions,
          components: presetData.components,
          previewImage: presetData.previewImage,
          photoImage: presetData.photoImage,
          createdAt: editingPreset?.createdAt || new Date(),
          updatedAt: new Date(),
        }

        console.log("Saving preset to database:", preset.id)
        await db.savePreset(preset)
        console.log("Preset saved successfully")

        onSave(preset)

        // Reload presets
        const presetsData = await db.getPresets()
        setPresets(presetsData)

        setIsCreating(false)
        setEditingPreset(null)

        alert("Preset saved successfully!")
      } catch (error) {
        console.error("Error saving preset:", error)
        alert("Error saving preset: " + (error as Error).message)
      }
    },
    [editingPreset, onSave],
  )

  const handleDeletePreset = useCallback(
    async (presetId: string) => {
      if (confirm("Are you sure you want to delete this preset?")) {
        try {
          await db.deletePreset(presetId)
          onDelete(presetId)

          // Reload presets
          const presetsData = await db.getPresets()
          setPresets(presetsData)
        } catch (error) {
          console.error("Error deleting preset:", error)
          alert("Error deleting preset: " + (error as Error).message)
        }
      }
    },
    [onDelete],
  )

  const handleCloseDialog = useCallback(() => {
    setIsCreating(false)
    setEditingPreset(null)
  }, [])

  const groupedPresets = presets.reduce(
    (acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = []
      }
      acc[preset.category].push(preset)
      return acc
    },
    {} as Record<string, PresetData[]>,
  )

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preset Management</h3>
          <Button onClick={handleCreatePreset}>
            <Plus className="w-4 h-4 mr-2" />
            Create Preset
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preset Management</h3>
        <Button onClick={handleCreatePreset}>
          <Plus className="w-4 h-4 mr-2" />
          Create Preset
        </Button>
      </div>

      {/* Preset Creation/Editing Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPreset ? "Edit Preset" : "Create New Preset"}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary>
            <PresetForm
              preset={editingPreset}
              components={components}
              onSave={handleSavePreset}
              onCancel={handleCloseDialog}
            />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>

      {/* Preset Preview Dialog */}
      <Dialog open={!!previewPreset} onOpenChange={(open) => !open && setPreviewPreset(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview: {previewPreset?.name}</DialogTitle>
          </DialogHeader>
          {previewPreset && <PresetPreview preset={previewPreset} components={components} />}
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Loading presets...</p>
          </CardContent>
        </Card>
      ) : Object.keys(groupedPresets).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No presets created yet</p>
            <p className="text-sm text-gray-400">Create your first preset to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPresets).map(([category, categoryPresets]) => (
            <div key={category}>
              <h4 className="text-md font-medium mb-3 flex items-center">
                {category}
                <Badge variant="secondary" className="ml-2">
                  {categoryPresets.length}
                </Badge>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {categoryPresets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    components={components}
                    onEdit={() => handleEditPreset(preset)}
                    onDelete={() => handleDeletePreset(preset.id)}
                    onPreview={() => setPreviewPreset(preset)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Preset Form Component
function PresetForm({
  preset,
  components,
  onSave,
  onCancel,
}: {
  preset: PresetData | null
  components: ComponentData[]
  onSave: (data: PresetFormData) => void
  onCancel: () => void
}) {
  // Ensure components is always an array
  const safeComponents = components || []

  const [formData, setFormData] = useState<PresetFormData>({
    name: preset?.name || "",
    category: preset?.category || "Living Room",
    description: preset?.description || "",
    roomDimensions: preset?.roomDimensions || { width: 6, length: 8, height: 3 },
    components: preset?.components || [],
    previewImage: preset?.previewImage,
    photoImage: preset?.photoImage,
  })

  const [canvasKey, setCanvasKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("canvas")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCanvasUpdate = useCallback(
    (
      canvasComponents: {
        componentId: string
        position: [number, number, number]
        rotation: [number, number, number]
      }[],
      previewImage?: string,
    ) => {
      console.log("Canvas updated with components:", canvasComponents.length)
      // Only update state, don't trigger save
      setFormData((prev) => ({
        ...prev,
        components: canvasComponents,
        previewImage,
      }))
    },
    [],
  )

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const photoImage = event.target?.result as string
      setFormData((prev) => ({
        ...prev,
        photoImage,
      }))
    }
    reader.readAsDataURL(file)
  }

  // Separate save handler that's only called by the save button
  const handleSaveClick = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a preset name")
      return
    }

    console.log("Save button clicked with data:", formData)

    try {
      setIsSubmitting(true)
      await onSave(formData)
    } catch (error) {
      console.error("Error saving preset:", error)
      alert("Failed to save preset: " + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Prevent form submission on Enter key or other events
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Don't auto-save, only save when save button is clicked
    console.log("Form submit prevented - use save button instead")
  }

  const resetCanvas = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      components: [],
      previewImage: undefined,
    }))
    setCanvasKey((prev) => prev + 1)
  }, [])

  const removePhoto = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      photoImage: undefined,
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Form wrapper that prevents auto-submission */}
      <form onSubmit={handleFormSubmit}>
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Modern Living Room Setup"
              required
            />
          </div>
          <div>
            <Label htmlFor="preset-category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger id="preset-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="preset-description">Description</Label>
          <Textarea
            id="preset-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe this preset and its intended use..."
            rows={3}
          />
        </div>

        {/* Room Dimensions */}
        <div className="mb-6">
          <Label>Room Dimensions (meters)</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <div>
              <Label htmlFor="room-width" className="text-xs">
                Width
              </Label>
              <Input
                id="room-width"
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={formData.roomDimensions.width}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roomDimensions: { ...formData.roomDimensions, width: Number.parseFloat(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="room-length" className="text-xs">
                Length
              </Label>
              <Input
                id="room-length"
                type="number"
                step="0.5"
                min="1"
                max="20"
                value={formData.roomDimensions.length}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roomDimensions: { ...formData.roomDimensions, length: Number.parseFloat(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="room-height" className="text-xs">
                Height
              </Label>
              <Input
                id="room-height"
                type="number"
                step="0.1"
                min="2"
                max="5"
                value={formData.roomDimensions.height}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roomDimensions: { ...formData.roomDimensions, height: Number.parseFloat(e.target.value) },
                  })
                }
              />
            </div>
          </div>
        </div>
      </form>

      {/* Tabs for Canvas and Photo - Outside of form to prevent submission */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="canvas">
            <Camera className="w-4 h-4 mr-2" />
            3D Configuration
          </TabsTrigger>
          <TabsTrigger value="photo">
            <Upload className="w-4 h-4 mr-2" />
            Photo Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="mt-0">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Preset Configuration</Label>
              <Button type="button" variant="outline" size="sm" onClick={resetCanvas}>
                <X className="w-3 h-3 mr-1" />
                Clear Canvas
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <PresetCanvas
                key={canvasKey}
                components={components}
                roomDimensions={formData.roomDimensions}
                initialComponents={formData.components}
                onUpdate={handleCanvasUpdate}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Drag components from the sidebar to arrange them. Use the controls to position and rotate components
              precisely.
            </p>
          </div>

          {/* Component Summary */}
          <div className="mt-4">
            <Label>Components in Preset ({formData.components.length})</Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
              {formData.components.length === 0 ? (
                <p className="text-sm text-gray-500">No components added yet</p>
              ) : (
                formData.components.map((comp, index) => {
                  const component = safeComponents.find((c) => c.id === comp.componentId)
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                      <span>{component?.name || "Unknown Component"}</span>
                      <span className="text-gray-500">
                        Position: ({comp.position[0].toFixed(1)}, {comp.position[1].toFixed(1)},{" "}
                        {comp.position[2].toFixed(1)})
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="photo" className="mt-0">
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-photo">Upload Photo</Label>
              <div className="mt-2">
                <Input
                  ref={fileInputRef}
                  id="preset-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="mb-2"
                />
                <p className="text-xs text-gray-500">
                  Upload a photo to represent this preset. This will be displayed on the preset card.
                </p>
              </div>
            </div>

            {formData.photoImage ? (
              <div className="relative">
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={formData.photoImage || "/placeholder.svg"}
                    alt="Preset photo"
                    className="w-full h-64 object-contain bg-gray-100"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removePhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg bg-gray-100 h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No photo uploaded</p>
                  <p className="text-sm">Upload a photo to represent this preset</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Actions - Outside of form, using button click handlers */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSaveClick} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {preset ? "Update Preset" : "Create Preset"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Preset Card Component
const PresetCard = React.memo(function PresetCard({
  preset,
  components,
  onEdit,
  onDelete,
  onPreview,
}: {
  preset: PresetData
  components: ComponentData[]
  onEdit: () => void
  onDelete: () => void
  onPreview: () => void
}) {
  // Ensure components is always an array
  const safeComponents = components || []

  const totalPrice = preset.components.reduce((sum, comp) => {
    const component = safeComponents.find((c) => c.id === comp.componentId)
    return sum + (component?.price || 0)
  }, 0)

  // Use photo image if available, otherwise use preview image
  const displayImage = preset.photoImage || preset.previewImage

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Preview Image */}
        <div className="h-32 bg-gray-100 relative">
          {displayImage ? (
            <img src={displayImage || "/placeholder.svg"} alt={preset.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Eye className="w-8 h-8" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {preset.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="font-semibold mb-2">{preset.name}</h4>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{preset.description}</p>

          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Components:</span>
              <span>{preset.components.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Room Size:</span>
              <span>
                {preset.roomDimensions?.width || 0}×{preset.roomDimensions?.length || 0}m
              </span>
            </div>
            <div className="flex justify-between font-medium text-gray-900">
              <span>Total Price:</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button size="sm" variant="outline" onClick={onPreview} className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

// Preset Preview Component
const PresetPreview = React.memo(function PresetPreview({
  preset,
  components,
}: {
  preset: PresetData
  components: ComponentData[]
}) {
  // Ensure components is always an array
  const safeComponents = components || []

  const totalPrice = preset.components.reduce((sum, comp) => {
    const component = safeComponents.find((c) => c.id === comp.componentId)
    return sum + (component?.price || 0)
  }, 0)

  // Use photo image if available, otherwise use preview image
  const displayImage = preset.photoImage || preset.previewImage

  return (
    <div className="space-y-4">
      {/* Preview Image */}
      {displayImage && (
        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <img src={displayImage || "/placeholder.svg"} alt={preset.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Preset Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span>{preset.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Room Size:</span>
              <span>
                {preset.roomDimensions?.width || 0}×{preset.roomDimensions?.length || 0}×
                {preset.roomDimensions?.height || 0}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Components:</span>
              <span>{preset.components.length}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-600">Total Price:</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-gray-600">{preset.description}</p>
        </div>
      </div>

      {/* Components List */}
      <div>
        <h4 className="font-medium mb-2">Components in Preset</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {preset.components.map((comp, index) => {
            const component = safeComponents.find((c) => c.id === comp.componentId)
            return (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div className="flex items-center space-x-3">
                  <img
                    src={component?.image || "/placeholder.svg?height=32&width=32&text=Component"}
                    alt={component?.name}
                    className="w-8 h-8 rounded"
                  />
                  <div>
                    <p className="font-medium text-sm">{component?.name}</p>
                    <p className="text-xs text-gray-500">{component?.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">€{component?.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    ({comp.position[0].toFixed(1)}, {comp.position[1].toFixed(1)}, {comp.position[2].toFixed(1)})
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

// Error Boundary Component
class ErrorBoundary extends React.Component<
  {},
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Caught error in ErrorBoundary", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">Something went wrong during preset creation/editing. Please try again.</p>
            {this.state.error && <p className="text-sm text-gray-500">{this.state.error.message}</p>}
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
