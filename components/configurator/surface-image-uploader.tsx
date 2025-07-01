"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Upload, Trash2, Image as ImageIcon, Eye, EyeOff } from "lucide-react"
import { useConfigurator } from "./configurator-context"
import { useTranslation } from "@/hooks/use-translation"

type SurfaceType = "ceiling" | "backWall" | "leftWall" | "rightWall" | "frontWall" | "floor"

interface SurfaceInfo {
  id: SurfaceType
  name: string
  description: string
}

const SURFACES: SurfaceInfo[] = [
  { id: "ceiling", name: "Ceiling", description: "Top surface" },
  { id: "backWall", name: "Back Wall", description: "Behind view" },
  { id: "leftWall", name: "Left Wall", description: "Left side" },
  { id: "rightWall", name: "Right Wall", description: "Right side" },
  { id: "frontWall", name: "Front Wall", description: "In front of view" },
  { id: "floor", name: "Floor", description: "Bottom surface" }
]

export function SurfaceImageUploader() {
  const { state, dispatch } = useConfigurator()
  const { t } = useTranslation()
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>("backWall")
  const [opacity, setOpacity] = useState(0.8)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && selectedSurface) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        
        if (!result || result === "undefined" || result === "null") {
          console.error("Invalid file read result")
          return
        }

        dispatch({ 
          type: "SET_SCENE_IMAGE", 
          surface: selectedSurface, 
          imageData: result 
        })
        
        console.log(`✅ Image uploaded to ${selectedSurface}`)
      }
      reader.onerror = () => {
        console.error("Failed to read file")
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (surface: SurfaceType) => {
    dispatch({ type: "REMOVE_SCENE_IMAGE", surface })
    console.log(`🗑️ Image removed from ${surface}`)
  }

  const getImageForSurface = (surface: SurfaceType): string | null => {
    return state.sceneImageSettings?.[surface] || null
  }

  const hasAnyImages = SURFACES.some(surface => getImageForSurface(surface.id))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Surface Images</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedSurface}
          >
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="hidden"
          title="Upload surface image"
          aria-label="Upload surface image"
        />

        {/* Surface Selection */}
        <div>
          <Label className="text-xs mb-2 block">Select Surface</Label>
          <Select value={selectedSurface} onValueChange={(value: SurfaceType) => setSelectedSurface(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SURFACES.map((surface) => (
                <SelectItem key={surface.id} value={surface.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{surface.name}</span>
                    {getImageForSurface(surface.id) && (
                      <ImageIcon className="w-3 h-3 ml-2 text-green-600" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {SURFACES.find(s => s.id === selectedSurface)?.description}
          </p>
        </div>

        {/* Current Surface Image Preview */}
        {selectedSurface && getImageForSurface(selectedSurface) && (
          <div>
            <Label className="text-xs mb-2 block">Current Image</Label>
            <div className="relative">
              <img
                src={getImageForSurface(selectedSurface)!}
                alt={`${selectedSurface} background`}
                className="w-full h-20 object-cover rounded border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=80&width=120&text=Error"
                }}
              />
              <div className="absolute top-1 right-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(selectedSurface)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Opacity Control */}
        {selectedSurface && getImageForSurface(selectedSurface) && (
          <div>
            <Label className="text-xs mb-2 block">Opacity</Label>
            <Slider
              value={[opacity]}
              onValueChange={([value]) => setOpacity(value)}
              min={0.1}
              max={1}
              step={0.05}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(opacity * 100)}%
            </div>
          </div>
        )}

        {/* Upload Instructions */}
        {!getImageForSurface(selectedSurface) && (
          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-xs text-gray-500 mb-2">No image for {SURFACES.find(s => s.id === selectedSurface)?.name}</p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3 h-3 mr-1" />
              Upload Image
            </Button>
          </div>
        )}

        {/* All Surfaces Overview */}
        <div>
          <Label className="text-xs mb-2 block">All Surfaces</Label>
          <div className="grid grid-cols-2 gap-2">
            {SURFACES.map((surface) => {
              const hasImage = getImageForSurface(surface.id)
              return (
                <div 
                  key={surface.id}
                  className={`flex items-center justify-between p-2 rounded border ${
                    selectedSurface === surface.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div 
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => setSelectedSurface(surface.id)}
                  >
                    {hasImage ? (
                      <Eye className="w-3 h-3 text-green-600" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs">{surface.name}</span>
                  </div>
                  {hasImage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeImage(surface.id)}
                      className="h-4 w-4 p-0"
                    >
                      <Trash2 className="w-2 h-2" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {hasAnyImages && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                SURFACES.forEach(surface => {
                  if (getImageForSurface(surface.id)) {
                    removeImage(surface.id)
                  }
                })
              }}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>
        )}

        {/* Usage Tips */}
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="space-y-1">
            <li>• Use high-resolution images for better quality</li>
            <li>• Back wall works best for room backgrounds</li>
            <li>• Ceiling images should have appropriate perspective</li>
            <li>• Adjust opacity to blend with your lighting design</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 