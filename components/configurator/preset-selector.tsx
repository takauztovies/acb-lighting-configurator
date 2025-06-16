"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Plus, Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useConfigurator, type LightComponent } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"
import { db, type PresetData, type ComponentData } from "@/lib/database"

export function PresetSelector() {
  const { dispatch } = useConfigurator()
  const { t } = useTranslation()
  const [presets, setPresets] = useState<PresetData[]>([])
  const [components, setComponents] = useState<ComponentData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [previewPreset, setPreviewPreset] = useState<PresetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load presets and components
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        await db.init()
        const [presetsData, componentsData] = await Promise.all([db.getPresets(), db.getComponents()])
        setPresets(presetsData)
        setComponents(componentsData)
      } catch (error) {
        console.error("Error loading presets:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter presets - memoize this calculation to prevent unnecessary re-renders
  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || preset.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(presets.map((p) => p.category)))]

  const loadPreset = useCallback(
    async (preset: PresetData) => {
      try {
        // Clear current configuration
        dispatch({
          type: "LOAD_PRESET",
          config: {
            id: `preset-${preset.id}`,
            name: preset.name,
            components: [],
            connections: [],
            totalPrice: 0,
            sceneImage: preset.photoImage || preset.previewImage,
          },
        })

        // Add each component from the preset
        for (const presetComponent of preset.components) {
          const componentData = components.find((c) => c.id === presetComponent.componentId)
          if (componentData) {
            const lightComponent: LightComponent = {
              ...componentData,
              id: `${componentData.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              position: presetComponent.position,
              rotation: presetComponent.rotation,
              connections: [],
              connectionPoints: [],
            }
            dispatch({ type: "ADD_COMPONENT", component: lightComponent })
          }
        }

        alert(`Preset "${preset.name}" loaded successfully!`)
      } catch (error) {
        console.error("Error loading preset:", error)
        alert("Error loading preset: " + error)
      }
    },
    [components, dispatch],
  )

  const calculatePresetPrice = useCallback(
    (preset: PresetData) => {
      return preset.components.reduce((sum, comp) => {
        const component = components.find((c) => c.id === comp.componentId)
        return sum + (component?.price || 0)
      }, 0)
    },
    [components],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t("presetConfigurations")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search presets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Presets List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">Loading presets...</p>
          ) : filteredPresets.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {presets.length === 0 ? t("noPresetsAvailable") : "No presets match your search"}
            </p>
          ) : (
            filteredPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                price={calculatePresetPrice(preset)}
                onLoad={() => loadPreset(preset)}
                onPreview={() => setPreviewPreset(preset)}
              />
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={!!previewPreset} onOpenChange={(open) => !open && setPreviewPreset(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewPreset?.name}</DialogTitle>
            </DialogHeader>
            {previewPreset && (
              <PresetPreview
                preset={previewPreset}
                components={components}
                onLoad={() => {
                  loadPreset(previewPreset)
                  setPreviewPreset(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Preset Card Component - Memoize this component to prevent unnecessary re-renders
const PresetCard = React.memo(
  ({
    preset,
    price,
    onLoad,
    onPreview,
  }: {
    preset: PresetData
    price: number
    onLoad: () => void
    onPreview: () => void
  }) => {
    // Use photo image if available, otherwise use preview image
    const displayImage = preset.photoImage || preset.previewImage

    return (
      <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-sm">{preset.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {preset.category}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{preset.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{preset.components.length} components</span>
              <span className="font-medium text-gray-900">€{price.toFixed(2)}</span>
            </div>
          </div>
          {displayImage && (
            <img
              src={displayImage || "/placeholder.svg"}
              alt={preset.name}
              className="w-16 h-12 object-cover rounded ml-3"
            />
          )}
        </div>
        <div className="flex space-x-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onPreview}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button size="sm" onClick={onLoad} className="flex-1 bg-gray-900 text-white hover:bg-gray-800">
            <Plus className="w-3 h-3 mr-1" />
            Load
          </Button>
        </div>
      </div>
    )
  },
)
PresetCard.displayName = "PresetCard"

// Preset Preview Component - Memoize this component to prevent unnecessary re-renders
const PresetPreview = React.memo(
  ({
    preset,
    components,
    onLoad,
  }: {
    preset: PresetData
    components: ComponentData[]
    onLoad: () => void
  }) => {
    const totalPrice = preset.components.reduce((sum, comp) => {
      const component = components.find((c) => c.id === comp.componentId)
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
                  {preset.roomDimensions.width}×{preset.roomDimensions.length}×{preset.roomDimensions.height}m
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
              const component = components.find((c) => c.id === comp.componentId)
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

        {/* Load Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onLoad} className="px-6 bg-gray-900 text-white hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" />
            Load This Preset
          </Button>
        </div>
      </div>
    )
  },
)
PresetPreview.displayName = "PresetPreview"
